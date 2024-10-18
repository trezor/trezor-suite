import * as messages from '@trezor/protobuf/messages.json';
import { BridgeTransport, Descriptor } from '@trezor/transport';

import { controller as TrezorUserEnvLink, env } from './controller';
import { assertSuccess } from '../api/utils';
import { PathPublic } from '@trezor/transport/src/types';

const emulatorStartOpts = { model: 'T2T1', version: '2-main', wipe: true } as const;

const forAllDescriptors = (
    descriptors: Record<string, Descriptor>,
    fn: (d: Descriptor) => Promise<void>,
) => {
    return Promise.all(Object.values(descriptors).map(fn));
};
// emulator does not support multiple devices yet
if (env.USE_HW) {
    describe('bridge', () => {
        let bridge: BridgeTransport;
        let descriptors: Record<string, Descriptor> = {};

        const getFeatures = (session: `${number}`) =>
            bridge.call({
                session,
                name: 'GetFeatures',
                data: {},
            });

        const acquire = (path: PathPublic) => {
            return bridge.acquire({
                input: { path, previous: null },
            });
        };

        beforeAll(async () => {
            await TrezorUserEnvLink.connect();
            await TrezorUserEnvLink.startEmu(emulatorStartOpts);
            await TrezorUserEnvLink.startEmu(emulatorStartOpts);
            await TrezorUserEnvLink.startBridge();
            bridge = new BridgeTransport({ messages });
            await bridge.init();

            const enumerateResult = await bridge.enumerate();
            assertSuccess(enumerateResult);
            expect(enumerateResult).toMatchObject({
                success: true,
                payload: [{ session: null }, { session: null }],
            });
            bridge.handleDescriptorsChange(enumerateResult.payload);

            descriptors = enumerateResult.payload.reduce((acc: typeof descriptors, d) => {
                acc[d.path] = d;

                return acc;
            }, descriptors);
        });

        afterAll(async () => {
            await TrezorUserEnvLink.stopBridge();
            TrezorUserEnvLink.disconnect();
        });

        const listening = [true, false];

        listening.forEach(l => {
            test(`${l ? 'client listening - ' : ''}[acquire acquire] - [call call] - [release release]`, async () => {
                if (l) {
                    bridge.listen();
                }

                await forAllDescriptors(descriptors, async d => {
                    const acquireResult = await acquire(d.path);
                    assertSuccess(acquireResult);
                    descriptors[d.path].session = acquireResult.payload;
                });

                await forAllDescriptors(descriptors, async d => {
                    const features = await getFeatures(d.session!);
                    expect(features).toMatchObject({ success: true });
                });

                await forAllDescriptors(descriptors, async d => {
                    await bridge.release({ session: d.session!, path: d.path });
                });
            });

            test(`${l ? 'client listening - ' : ''}[acquire call release] - [acquire call release]`, async () => {
                if (l) {
                    bridge.listen();
                }

                await forAllDescriptors(descriptors, async d => {
                    const acquireResult = await acquire(d.path);
                    assertSuccess(acquireResult);
                    d.session = acquireResult.payload;
                    const features = await getFeatures(d.session!);
                    expect(features).toMatchObject({ success: true });
                    await bridge.release({ session: d.session!, path: d.path });
                });
            });
        });
    });
}
