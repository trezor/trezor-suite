import { type DeviceIdentity, asDeviceUniquePath } from '@trezor/connect';
import { type GetTrezorConnect } from '@trezor/connect-common';

import {
    type RetrieveDelegatedIdentityKeyParams,
    createRetrieveDelegatedIdentityKeyFromDevice,
} from './retrieveDelegatedIdentityKeyFromDevice';

const device123: RetrieveDelegatedIdentityKeyParams['device'] = {
    path: asDeviceUniquePath('1/2/3'),
    state: { staticSessionId: '1@2:3' },
    connected: true,
};

const mockGetTrezorConnect: GetTrezorConnect<'evoluGetDelegatedIdentityKey'> = () => ({
    evoluGetDelegatedIdentityKey: device =>
        Promise.resolve({
            device: device as DeviceIdentity,
            success: true,
            payload: { private_key: 'delegated-key-123' },
        }),
});

describe(createRetrieveDelegatedIdentityKeyFromDevice.name, () => {
    it('calls TrezorConnect to get the delegated key', async () => {
        const retrieveDelegatedIdentityKeyFromDevice = createRetrieveDelegatedIdentityKeyFromDevice(
            { getTrezorConnect: mockGetTrezorConnect },
        );

        const result = await retrieveDelegatedIdentityKeyFromDevice({
            device: device123,
        });

        expect(result.success).toBe(true);
        expect(result.success && result.payload).toBe('delegated-key-123');
    });

    it('returns DeviceNotConnectedError without calling Connect when device is not connected', async () => {
        const getTrezorConnect = jest.fn();
        const retrieveDelegatedIdentityKeyFromDevice = createRetrieveDelegatedIdentityKeyFromDevice(
            { getTrezorConnect },
        );

        const result = await retrieveDelegatedIdentityKeyFromDevice({
            device: { ...device123, connected: false },
        });

        expect(result.success).toBe(false);
        expect(!result.success && result.error.type).toBe('DeviceNotConnectedError');
        expect(getTrezorConnect).not.toHaveBeenCalled();
    });
});
