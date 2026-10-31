import { type Dispatch } from '@reduxjs/toolkit';

import { bluetoothActions } from '@suite-common/bluetooth';

import { type BackgroundScan } from './bluetoothBackgroundScan';

type BluetoothForgetAllDevicesDeps = {
    dispatch: Dispatch;
    backgroundScan: BackgroundScan;
};

export type BluetoothForgetAllDevices = () => void;

export const createBluetoothForgetAllDevices =
    (deps: BluetoothForgetAllDevicesDeps): BluetoothForgetAllDevices =>
    () => {
        deps.dispatch(bluetoothActions.knownDevicesUpdateAction({ knownDevices: [] }));

        deps.backgroundScan.restartIfNeeded();
    };
