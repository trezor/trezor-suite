import { type Dispatch } from '@reduxjs/toolkit';

import { bluetoothActions } from '@suite-common/bluetooth';

import { type DesktopBluetoothDevice } from './DesktopBluetoothDevice';
import { filterOutNonResponsiveDevices } from './filterOutNonResponsiveDevices';

type BluetoothRemoveStaleDevicesDeps = {
    getNearbyDevices: () => DesktopBluetoothDevice[];
    dispatch: Dispatch;
};

export type BluetoothRemoveStaleDevices = () => void;

export const createBluetoothRemoveStaleDevices =
    (deps: BluetoothRemoveStaleDevicesDeps): BluetoothRemoveStaleDevices =>
    () => {
        const nearbyDevices = deps.getNearbyDevices();

        deps.dispatch(
            bluetoothActions.nearbyDevicesUpdateAction({
                nearbyDevices: filterOutNonResponsiveDevices(nearbyDevices),
            }),
        );
    };
