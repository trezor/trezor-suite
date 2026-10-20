import { type Dispatch } from '@reduxjs/toolkit';

import { bluetoothActions, selectNearbyDevices } from '@suite-common/bluetooth';

import { type DesktopBluetoothDevice } from './DesktopBluetoothDevice';
import { type WithBluetoothRootState } from './desktopBluetoothReducer';
import { filterOutNonResponsiveDevices } from './filterOutNonResponsiveDevices';

type BluetoothRemoveStaleDevicesRootState = WithBluetoothRootState;

type BluetoothRemoveStaleDevicesDeps = {
    getState: () => BluetoothRemoveStaleDevicesRootState;
    dispatch: Dispatch;
};

type BluetoothRemoveStaleDevices = () => void;

export const createBluetoothRemoveStaleDevices =
    (deps: BluetoothRemoveStaleDevicesDeps): BluetoothRemoveStaleDevices =>
    () => {
        const nearbyDevices = selectNearbyDevices<DesktopBluetoothDevice>(deps.getState());

        deps.dispatch(
            bluetoothActions.nearbyDevicesUpdateAction({
                nearbyDevices: filterOutNonResponsiveDevices(nearbyDevices),
            }),
        );
    };
