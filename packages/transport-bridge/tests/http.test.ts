import { getFreePort } from '@trezor/node-utils';
import { AbstractApi } from '@trezor/transport/src/api/abstract';

import { TrezordNode } from '../src/http';

const muteLogger = {
    info: (..._args: string[]) => {},
    debug: (..._args: string[]) => {},
    log: (..._args: string[]) => {},
    warn: (..._args: string[]) => {},
    error: (..._args: string[]) => {},
};

// todo: szymon is about to re-use this from a single file
const createTransportApi = (override = {}) =>
    ({
        chunkSize: 0,
        enumerate: () => {
            return Promise.resolve({ success: true, payload: [{ path: '1' }] });
        },
        on: () => {},
        off: () => {},
        openDevice: (path: string) => {
            return Promise.resolve({ success: true, payload: [{ path }] });
        },
        closeDevice: () => {
            return Promise.resolve({ success: true });
        },
        write: () => {
            return Promise.resolve({ success: true });
        },
        read: () => {
            return Promise.resolve({
                success: true,
                payload: Buffer.from('3f232300110000000c1002180020006000aa010154', 'hex'), // partial proto.Features
                // payload: Buffer.from('3f23230002000000060a046d656f77', 'hex'), // proto.Success
            });
        },
        dispose: () => {},
        ...override,
    }) as unknown as AbstractApi;

describe('http', () => {
    let port: number;
    beforeAll(async () => {
        port = await getFreePort();
    });

    (['usb', 'udp'] as const).forEach(api => {
        it(`node bridge using ${api} api should start and stop without stopping jest from exiting`, async () => {
            const trezordNode = new TrezordNode({
                port,
                api,
                // @ts-expect-error
                logger: muteLogger,
            });
            await trezordNode.start();
            await trezordNode.stop();
        });
    });

    it('constructor accepts custom AbstractApi', () => {
        new TrezordNode({
            port,
            api: createTransportApi(),
            // @ts-expect-error
            logger: muteLogger,
        });
    });
});
