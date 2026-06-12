/* eslint-disable no-console */

import dgram from 'node:dgram';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { EmulatorWrapper } from '../src';

const EMULATOR_HOST = '127.0.0.1';
const EMULATOR_MAIN_PORT = 21324;
const EMULATOR_DEBUG_PORT = 21325;
const PING = Buffer.from('PINGPING');
const PONG = Buffer.from('PONGPONG');
const PING_TIMEOUT_MS = 4000;

const sendPingExpectPong = (host: string, port: number, label: string): Promise<void> =>
    new Promise((resolve, reject) => {
        const socket = dgram.createSocket('udp4');
        const finish = (action: () => void) => {
            socket.close(() => action());
        };
        const timer = setTimeout(() => {
            finish(() => reject(new Error(`${label}: no PONG within ${PING_TIMEOUT_MS}ms`)));
        }, PING_TIMEOUT_MS);

        socket.once('message', message => {
            clearTimeout(timer);
            const payload = Buffer.from(message);
            finish(() => {
                if (payload.equals(PONG)) {
                    resolve();
                } else {
                    reject(
                        new Error(`${label}: expected PONGPONG, got ${payload.toString('hex')}`),
                    );
                }
            });
        });

        socket.send(PING, port, host, error => {
            if (error) {
                clearTimeout(timer);
                finish(() => reject(error));
            }
        });
    });

(async () => {
    let wrapper: EmulatorWrapper | undefined;

    try {
        console.log('connecting to trezor-user-env');
        await TrezorUserEnvLink.connect();

        console.log('starting emulator');
        await TrezorUserEnvLink.startEmu({ wipe: true });

        console.log('stopping bridge spawned by user-env (wrapper talks UDP directly)');
        await TrezorUserEnvLink.stopBridge();

        console.log('sanity check: direct PINGPING -> emulator main');
        await sendPingExpectPong(EMULATOR_HOST, EMULATOR_MAIN_PORT, 'direct main');
        console.log('  emulator main responded with PONGPONG');

        console.log('starting EmulatorWrapper on ephemeral ports');
        wrapper = new EmulatorWrapper({
            main: {
                listenPort: 0,
                targetHost: EMULATOR_HOST,
                targetPort: EMULATOR_MAIN_PORT,
            },
            debug: {
                listenPort: 0,
                targetHost: EMULATOR_HOST,
                targetPort: EMULATOR_DEBUG_PORT,
            },
            logger: msg => console.log('  [wrapper]', msg),
        });
        await wrapper.start();
        const [mainEndpoint, debugEndpoint] = wrapper.getEndpoints();
        console.log(
            `  wrapper main :${mainEndpoint.listenPort} -> :${mainEndpoint.targetPort}, debug :${debugEndpoint.listenPort} -> :${debugEndpoint.targetPort}`,
        );

        console.log('PINGPING -> wrapper main -> emulator -> wrapper -> us');
        await sendPingExpectPong(
            mainEndpoint.listenHost,
            mainEndpoint.listenPort,
            'via wrapper main',
        );
        console.log('  wrapper main forwarded PINGPING and PONGPONG end-to-end');

        console.log('PINGPING -> wrapper debug -> emulator debug -> wrapper -> us');
        await sendPingExpectPong(
            debugEndpoint.listenHost,
            debugEndpoint.listenPort,
            'via wrapper debug',
        );
        console.log('  wrapper debug forwarded PINGPING and PONGPONG end-to-end');

        console.log('stopping wrapper');
        await wrapper.stop();
        wrapper = undefined;

        console.log('stopping emulator');
        await TrezorUserEnvLink.stopEmu();

        await TrezorUserEnvLink.disconnect();
        console.log('ALL TESTS DONE');
    } catch (error) {
        if (wrapper) {
            await wrapper.stop().catch(() => undefined);
        }
        await TrezorUserEnvLink.disconnect().catch(() => undefined);
        throw error;
    }
})().catch(error => {
    console.error(error);
    process.exit(1);
});
