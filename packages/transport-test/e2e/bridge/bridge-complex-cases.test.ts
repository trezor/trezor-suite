import * as messages from '@trezor/protobuf/messages.json';
import { BridgeTransport } from '@trezor/transport';

import { controller as TrezorUserEnvLink, env } from './controller';
import { descriptor as expectedDescriptor } from './expect';
import { assertSuccess } from '../api/utils';

const assertBridgeNotRunning = async () => {
    await expect(
        fetch('http://localhost:21325/', {
            method: 'GET',
        }),
    ).rejects.toThrow('fetch failed');
};

// all scenarios that require restarting bridge.
describe('restarting bridge', () => {
    let bridge: BridgeTransport;
    let devices: any[];
    let session: any;
    beforeAll(async () => {
        await TrezorUserEnvLink.connect();
        await TrezorUserEnvLink.startEmu();
        await TrezorUserEnvLink.startBridge();

        const abortController = new AbortController();
        bridge = new BridgeTransport({ messages, signal: abortController.signal });
        await bridge.init().promise;

        const enumerateResult = await bridge.enumerate().promise;
        assertSuccess(enumerateResult);
        devices = enumerateResult.payload;

        const acquireResult = await bridge.acquire({
            input: { path: devices[0].path, previous: session },
        }).promise;
        assertSuccess(acquireResult);
        session = acquireResult.payload;
    });

    afterAll(async () => {
        await TrezorUserEnvLink.stopEmu();
        await TrezorUserEnvLink.stopBridge();
        TrezorUserEnvLink.disconnect();
    });

    // This scenario crashes the old bridge (2.0.33) on Mac. New bridge seems to be performing correctly
    test('Bridge stops while device is acquired then starts again and client tries to force acquire device', async () => {
        await bridge.send({ session, name: 'GetFeatures', data: {} }).promise;

        await TrezorUserEnvLink.stopBridge();
        await TrezorUserEnvLink.startEmu();
        await TrezorUserEnvLink.startBridge();
        const abortController = new AbortController();
        bridge = new BridgeTransport({ messages, signal: abortController.signal });
        await bridge.init().promise;

        const enumerateResult = await bridge.enumerate().promise;
        assertSuccess(enumerateResult);
        expect(enumerateResult).toMatchObject({
            success: true,
            payload: [
                {
                    path: expect.any(String),
                    product: expectedDescriptor.product,
                },
            ],
        });
        devices = enumerateResult.payload;

        // acquire hangs and once it is aborted by client, the bridge crashes
        await bridge.acquire({
            input: {
                path: devices[0].path,
                // OK so not sending previous (or sending null (force)) is the key ingredient
                // so maybe it is not about send at all? it looks like that only one send is enough to cause it
                previous: null,
            },
        }).promise;

        // old bridge is crashed and only if using HW, not emu.
        if (!env.USE_NODE_BRIDGE && env.USE_HW) {
            await assertBridgeNotRunning();

            return;
        } else {
            // new bridge received some nice fixes and now we can continue
            const enumerateResult2 = await bridge.enumerate().promise;
            expect(enumerateResult2).toMatchObject({
                success: true,
                payload: [
                    {
                        path: expect.any(String),
                    },
                ],
            });
        }
    });
});
