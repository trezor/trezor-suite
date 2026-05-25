import { BridgeTransport } from '@trezor/transport';
import { type Descriptor, type Session } from '@trezor/transport-common';

import { controller as TrezorUserEnvLink } from './controller';
import { descriptor as expectedDescriptor } from './expect';
import { assertSuccess } from '../api/utils';

// all scenarios that require restarting bridge.
describe('restarting bridge', () => {
    let bridge: BridgeTransport;
    let descriptors: Descriptor[];
    let session: Session;
    beforeAll(async () => {
        await TrezorUserEnvLink.connect();
        await TrezorUserEnvLink.startEmu();
        await TrezorUserEnvLink.startBridge();

        bridge = new BridgeTransport({ id: '' });
        await bridge.init();

        const enumerateResult = await bridge.enumerate();
        assertSuccess(enumerateResult);
        descriptors = enumerateResult.payload;

        const firstDescriptor = descriptors[0];
        if (!firstDescriptor) {
            throw new Error('Expected at least one descriptor');
        }

        const acquireResult = await bridge.acquire({
            input: { path: firstDescriptor.path, previous: session },
        });
        assertSuccess(acquireResult);
        session = acquireResult.payload;
    });

    afterAll(async () => {
        await TrezorUserEnvLink.stopEmu();
        await TrezorUserEnvLink.stopBridge();
        TrezorUserEnvLink.disconnect();
    });

    // Note: for node-bridge this doesn't work for model One - model hangs on one of the device.reset calls and becomes unresponsive
    test('Bridge stops while device is acquired then starts again and client tries to force acquire device', async () => {
        await bridge.send({ session, name: 'GetFeatures', data: {} });

        await TrezorUserEnvLink.stopBridge();
        await TrezorUserEnvLink.startEmu();
        await TrezorUserEnvLink.startBridge();
        bridge = new BridgeTransport({ id: '' });
        await bridge.init();

        const enumerateResult = await bridge.enumerate();
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
        descriptors = enumerateResult.payload;

        const currentDescriptor = descriptors[0];
        if (!currentDescriptor) {
            throw new Error('Expected at least one descriptor');
        }

        // acquire hangs and once it is aborted by client, the bridge crashes
        await bridge.acquire({
            input: {
                path: currentDescriptor.path,
                // OK so not sending previous (or sending null (force)) is the key ingredient
                // so maybe it is not about send at all? it looks like that only one send is enough to cause it
                previous: null,
            },
        });

        const enumerateResult2 = await bridge.enumerate();
        expect(enumerateResult2).toMatchObject({
            success: true,
            payload: [
                {
                    path: expect.any(String),
                },
            ],
        });
    });
});
