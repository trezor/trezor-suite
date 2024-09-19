import * as messages from '@trezor/protobuf/messages.json';
import { BridgeTransport } from '@trezor/transport';

import { controller as TrezorUserEnvLink } from './controller';
import { descriptor as expectedDescriptor } from './expect';
import { assertSuccess } from '../api/utils';

const emulatorStartOpts = { model: 'T2T1', version: '2-main', wipe: true } as const;

describe('bridge', () => {
    beforeAll(async () => {
        await TrezorUserEnvLink.connect();
        await TrezorUserEnvLink.stopBridge();
        await TrezorUserEnvLink.startEmu(emulatorStartOpts);
    });

    afterAll(async () => {
        await TrezorUserEnvLink.stopEmu();
        await TrezorUserEnvLink.stopBridge();
        TrezorUserEnvLink.disconnect();
    });

    // special case of listen. for happy-path listen fixtures referer to multi-client.test.ts
    test('listen - bridge already has some descriptors, client subscribes with non-matching descriptors', async () => {
        await TrezorUserEnvLink.startBridge();
        const bridge = new BridgeTransport({ messages });
        await bridge.init();
        const enumerateResult = await bridge.enumerate();
        assertSuccess(enumerateResult);
        bridge.handleDescriptorsChange([]);
        const brideSpy = jest.spyOn(bridge, 'emit');
        bridge.listen();
        await new Promise(resolve => setTimeout(resolve, 100));
        expect(brideSpy).toHaveBeenCalledWith('transport-update', {
            descriptor: { ...expectedDescriptor, session: null },
            type: 'connected',
        });
        bridge.removeAllListeners('transport-update');
        jest.clearAllMocks();
    });
});
