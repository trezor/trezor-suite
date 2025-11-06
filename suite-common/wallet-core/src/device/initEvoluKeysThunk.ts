// Todo: This is here so "solve" the "Error: No "exports" main defined in /home/user/workspace/trezor/trezor-suite/node_modules/@evolu/common/package.json"
//       For running the e2e tests in Playwright
// See: https://github.com/trezor/trezor-suite/issues/22316
const loadEvoluCommon = async () => await import('@evolu/common');
const loadLocalFistStorage = async () =>
    await import('@suite-common/local-first-storage/src/evoluUtils');

import { createThunk } from '@suite-common/redux-utils';
import { EvoluKeys, TrezorDevice, asDeviceEvoluOwnerId } from '@suite-common/suite-types';
import TrezorConnect from '@trezor/connect';

import { DEVICE_MODULE_PREFIX, deviceActions } from './deviceActions';
import { selectDevices } from './deviceSelectors';

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
                    instance: device.instance,
                },
                useEmptyPassphrase: device.useEmptyPassphrase,
            });

            if (result.success) {
                const { hexToBytes, OwnerSecret } = await loadEvoluCommon();

                const ownerResult = OwnerSecret.from(
                    hexToBytes(result.payload.data)
                        // Get only [0, 32] Slip21 Node Data (Node Key [32, 64] is irrelevant for Evolu)
                        .slice(0, 32),
                );

                if (!ownerResult.ok) {
                    console.error('Evolu: ownerResult error', ownerResult.error);

                    throw ownerResult.error;
                }

                const { createAppOwnerFromTrezorNode } = await loadLocalFistStorage();

                const ownerIdResult = createAppOwnerFromTrezorNode(ownerResult.value);

                if (!ownerIdResult.ok) {
                    console.error('Evolu: ownerIdResult error', ownerIdResult.error);

                    throw ownerIdResult.error;
                }

                const evoluKeys: EvoluKeys = {
                    ownerId: asDeviceEvoluOwnerId(ownerIdResult.value.id),
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
