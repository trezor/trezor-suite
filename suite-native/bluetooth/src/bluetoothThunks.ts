import {
    BLUETOOTH_PREFIX,
    type ForgetBluetoothDeviceThunkParams,
    bluetoothActions,
} from '@suite-common/bluetooth';
import { createThunk } from '@suite-common/redux-utils';

export const forgetBluetoothDeviceThunk = createThunk<void, ForgetBluetoothDeviceThunkParams, void>(
    `${BLUETOOTH_PREFIX}/forgetBluetoothDevice`,
    ({ isOsUnpairingFinished }, { dispatch }) => {
        dispatch(bluetoothActions.setIsDeviceOsUnpairingRequired(!isOsUnpairingFinished));
    },
);
