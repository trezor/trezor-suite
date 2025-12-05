import { DeviceIdentity, asDeviceUniquePath } from '@trezor/connect';

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
        Promise.resolve({
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
            thpStaticHostKey: 'thp-static-key',
        });

        expect(result.ok).toBe(true);
        expect(result.ok && result.value).toBe('delegated-key-123');
    });
});
