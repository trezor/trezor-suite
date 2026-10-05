import { noopCreateLogger } from '@trezor/logger';
import { PathPublic } from '@trezor/transport-common';

import { Device } from './Device';

const { createTestTransport } = global.JestMocks;

describe('Device', () => {
    it('lists THP credentials without the host static key', () => {
        const device = new Device({
            id: 'ABCD' as any, // any = DeviceUniquePath
            transport: createTestTransport(),
            descriptor: { path: PathPublic('1'), type: 1, session: null, apiType: 'usb' },
            createLogger: noopCreateLogger,
        });
        device.setupThp();
        device.getThpState()?.setPairingCredentials([
            {
                trezor_static_public_key: 'aa',
                credential: 'bb',
                host_static_key: 'cc',
                autoconnect: true,
            },
        ]);

        const message = device.toMessageObject();

        expect(message).toMatchObject({
            type: 'unacquired',
            thp: {
                credentials: [
                    { trezor_static_public_key: 'aa', credential: 'bb', autoconnect: true },
                ],
            },
        });
        expect(JSON.stringify(message)).not.toContain('host_static_key');
        expect(device.getThpState()?.pairingCredentials).toHaveProperty(
            [0, 'host_static_key'],
            'cc',
        );
    });
});
