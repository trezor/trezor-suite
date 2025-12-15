import type { ForgetBluetoothDeviceThunkParams } from '@suite-common/bluetooth';
import { BLUETOOTH_PREFIX, bluetoothActions } from '@suite-common/bluetooth';
import { createThunk } from '@suite-common/redux-utils';

export const forgetBluetoothDeviceThunk = createThunk<void, ForgetBluetoothDeviceThunkParams, void>(
    `${BLUETOOTH_PREFIX}/forgetBluetoothDevice`,
    ({ bluetoothId }, { dispatch }) => {
        dispatch(bluetoothActions.removeKnownDeviceAction({ id: bluetoothId }));
        dispatch(bluetoothActions.setIsDeviceOsUnpairingRequired(true));
    },
);
