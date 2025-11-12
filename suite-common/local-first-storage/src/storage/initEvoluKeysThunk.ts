import { createThunk } from '@suite-common/redux-utils';
import { EvoluKeys, TrezorDevice, asDeviceEvoluOwnerId } from '@suite-common/suite-types';
import { DEVICE_MODULE_PREFIX, deviceActions, selectDevices } from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';

import { createEvoluAppOwnerFromTrezorData } from '../createEvoluAppOwnerFromTrezorData';

type InitCipherKeyThunkParams = {
    device: TrezorDevice;
};

export const initEvoluKeysThunk = createThunk<void, InitCipherKeyThunkParams, void>(
    `${DEVICE_MODULE_PREFIX}/initEvoluKeysThunk`,
    async ({ device: originalDevice }, { dispatch, getState, rejectWithValue }) => {
        if (originalDevice.state?.staticSessionId === undefined) {
            return;
        }

        const device = selectDevices(getState())?.find(
            it => it.state?.staticSessionId === originalDevice.state?.staticSessionId,
        );

        if (
            device === undefined ||
            device.state === undefined ||
            device.localFirstStorageSecret?.evoluKeys !== undefined ||
            // We are already getting the keys in different "await"
            // This may happen if selectedDeviceThunk is called concurrently.
            // Todo: This probably shall not happen, but it happens currently.
            device.localFirstStorageSecret?.isRetrieving
        ) {
            return;
        }

        dispatch(
            deviceActions.setLocalFirstStorageSecretRetrieving({ device, isRetrieving: true }),
        );

        try {
            const result = await TrezorConnect.evoluGetNode({
                device: {
                    path: device.path,
                    state: device.state,
                    ...(device.instance !== undefined ? { instance: device.instance } : {}),
                },
                useEmptyPassphrase: device.useEmptyPassphrase ?? false,
            });

            if (result.success) {
                const appOwnerResult = createEvoluAppOwnerFromTrezorData({
                    data: result.payload.data,
                });

                if (!appOwnerResult.ok) {
                    console.error('Evolu: appOwnerResult error', appOwnerResult.error);

                    throw appOwnerResult.error;
                }

                const evoluKeys: EvoluKeys = {
                    ownerId: asDeviceEvoluOwnerId(appOwnerResult.value.id),
                    ownerSecret: result.payload.data,
                };

                // This also sets the `isRetrieving` flag to `false`
                dispatch(deviceActions.setLocalFirstStorageSecret({ device, evoluKeys }));
            } else {
                console.error('Evolu: TrezorConnect.evoluGetNode(...) rejected: ', result.payload);

                dispatch(
                    deviceActions.setLocalFirstStorageSecretRetrieving({
                        device,
                        isRetrieving: false,
                    }),
                );

                return rejectWithValue(result.payload);
            }
        } catch (e) {
            dispatch(
                deviceActions.setLocalFirstStorageSecretRetrieving({ device, isRetrieving: false }),
            );

            throw e;
        }
    },
);
