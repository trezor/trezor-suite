// Todo: This is here so "solve" the "Error: No "exports" main defined in /home/user/workspace/trezor/trezor-suite/node_modules/@evolu/common/package.json"
//       For running the e2e tests in Playwright
const loadEvoluCommon = async () => await import('@evolu/common');

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

        const result = await TrezorConnect.evoluGetNode({
            device: {
                path: device.path,
                state: device.state,
                instance: device.instance,
            },
            useEmptyPassphrase: device.useEmptyPassphrase,
        });

        if (result.success) {
            const { deriveSlip21Node, bytesToHex, hexToBytes } = await loadEvoluCommon();

            // Slip21 path from Trezor Device: ["TREZOR", "Evolu"]
            const evoluNode = hexToBytes(result.payload.data);

            const evoluKeys: EvoluKeys = {
                ownerId: asDeviceEvoluOwnerId(
                    bytesToHex(deriveSlip21Node('Owner Id', evoluNode).slice(32, 64)),
                ),
                writeKey: bytesToHex(deriveSlip21Node('Write Key', evoluNode).slice(32, 64)),
                encryptionKey: bytesToHex(
                    deriveSlip21Node('Encryption Key', evoluNode).slice(32, 64),
                ),
            };

            // This also sets the `isRetrieving` flag to `false`
            dispatch(deviceActions.setLocalFirstStorageSecret({ device, evoluKeys }));
        } else {
            dispatch(
                deviceActions.setLocalFirstStorageSecretRetrieving({ device, isRetrieving: false }),
            );

            return rejectWithValue(result.payload);
        }
    },
);
