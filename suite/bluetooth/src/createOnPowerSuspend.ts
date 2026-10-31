import { type Dispatch } from '@reduxjs/toolkit';

import { bluetoothActions } from '@suite-common/bluetooth';

import { type DesktopBluetoothDevice } from './DesktopBluetoothDevice';
import { type BackgroundScan } from './bluetoothBackgroundScan';
import { type BluetoothDisconnectDevice } from './createBluetoothDisconnectDevice';
import { isBluetoothDeviceReachable } from './isBluetoothDeviceReachable';

type OnPowerSuspendDeps = {
    getKnownDevices: () => DesktopBluetoothDevice[];
    dispatch: Dispatch;
    backgroundScan: BackgroundScan;
    disconnectDevice: BluetoothDisconnectDevice;
};

export type OnPowerSuspend = () => void;

// This is only useful for macOS
export const createOnPowerSuspend =
    (deps: OnPowerSuspendDeps): OnPowerSuspend =>
    () => {
        deps.dispatch(bluetoothActions.adapterEventAction({ status: 'power-suspending' }));

        deps.backgroundScan.stop();

        const knownDevices = deps.getKnownDevices();
        knownDevices.forEach(device => {
            if (isBluetoothDeviceReachable(device)) {
                void deps.disconnectDevice(device.id);
            }
        });
    };
