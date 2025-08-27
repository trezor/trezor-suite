import { deriveSlip21Node } from '@evolu/common';
import { bytesToHex, hexToBytes } from '@noble/ciphers/utils';

import { createThunk } from '@suite-common/redux-utils';
import { EvoluKeys, TrezorDevice } from '@suite-common/suite-types';
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

        if (device === undefined || device.localFirstStorageSecret !== undefined) {
            return;
        }

        const result = await TrezorConnect.evoluGetNode({
            device: {
                path: device.path,
                state: device.state,
                instance: device.instance,
            },
            useEmptyPassphrase: device.useEmptyPassphrase,
        });

        if (result.success) {
            // Slip21 path from Trezor Device: ["TREZOR", "Evolu"]
            const evoluNode = hexToBytes(result.payload.data);

            const evoluKeys: EvoluKeys = {
                ownerId: bytesToHex(deriveSlip21Node('Owner Id', evoluNode).slice(32, 64)),
                writeKey: bytesToHex(deriveSlip21Node('Write Key', evoluNode).slice(32, 64)),
                encryptionKey: bytesToHex(
                    deriveSlip21Node('Encryption Key', evoluNode).slice(32, 64),
                ),
            };

            dispatch(deviceActions.setLocalFirstStorageSecret({ device, evoluKeys }));
        } else {
            return rejectWithValue(result.payload);
        }
    },
);
