import { CancelablePromise, DeviceIdentity, asDeviceUniquePath } from '@trezor/connect';

import {
    RetrieveDelegatedIdentityKeyFromDeviceDeps,
    RetrieveDelegatedIdentityKeyParams,
    createRetrieveDelegatedIdentityKeyFromDevice,
} from '../retrieveDelegatedIdentityKeyFromDevice';

const device123: RetrieveDelegatedIdentityKeyParams['device'] = {
    path: asDeviceUniquePath('1/2/3'),
    state: { staticSessionId: '1@2:3' },
};

const connectSimple: RetrieveDelegatedIdentityKeyFromDeviceDeps['trezorConnect'] = {
    evoluGetDelegatedIdentityKey: device =>
        CancelablePromise.resolve({
            device: device as DeviceIdentity,
            success: true,
            payload: { private_key: 'delegated-key-123' },
        }),
};

describe(createRetrieveDelegatedIdentityKeyFromDevice.name, () => {
    it('calls TrezorConnect to get the delegated key', async () => {
        const retrieveDelegatedIdentityKeyFromDevice = createRetrieveDelegatedIdentityKeyFromDevice(
            { trezorConnect: connectSimple },
        );

        const result = await retrieveDelegatedIdentityKeyFromDevice({
            device: device123,
        });

        expect(result.success).toBe(true);
        expect(result.success && result.payload).toBe('delegated-key-123');
    });
});
