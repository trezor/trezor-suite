import { type BackgroundScanDep } from './bluetoothBackgroundScan';
import { type BluetoothInit, type BluetoothInitDep } from './createBluetoothInit';

export type BluetoothDeps = BluetoothInitDep & BackgroundScanDep;

export type Bluetooth = {
    init: BluetoothInit;
    restartBackgroundScanIfNeeded: () => void;
};

export type BluetoothDep = {
    bluetooth: Bluetooth;
};

export const createBluetooth = (deps: BluetoothDeps): Bluetooth => ({
    init: deps.bluetoothInit,
    restartBackgroundScanIfNeeded: () => deps.backgroundScan.restartIfNeeded(),
});
