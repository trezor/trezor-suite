import { createThunk } from '@suite-common/redux-utils';
import { TrezorDevice } from '@suite-common/suite-types';
import { DEVICE_MODULE_PREFIX, EvoluKeys, deviceActions } from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';

type InitCipherKeyThunkParams = {
    device: TrezorDevice;
};

export const initEvoluKeysThunk = createThunk<void, InitCipherKeyThunkParams, void>(
    `${DEVICE_MODULE_PREFIX}/initEvoluKeysThunk`,
    async ({ device }, { dispatch }) => {
        if (device.state?.staticSessionId === undefined) {
            return;
        }

        // We already have the keys
        if (device.localFirstStorageSecret !== undefined) {
            return;
        }

        const result = await TrezorConnect.evoluGetKeys({
            device: {
                path: device.path,
                state: device.state,
                instance: device.instance,
            },
            useEmptyPassphrase: device.useEmptyPassphrase,
        });

        console.log('____initEvoluKeysThunk', result);

        if (result.success) {
            const evoluKeys: EvoluKeys = {
                ownerId: result.payload.owner_id,
                writeKey: result.payload.write_key,
                encryptionKey: result.payload.encryption_key,
            };

            dispatch(deviceActions.setLocalFirstStorageSecret({ device, evoluKeys }));
        } else {
            console.error('___evoluGetKeys error:', result.payload);
        }
    },
);
