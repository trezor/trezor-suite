import { type BackgroundScan } from './bluetoothBackgroundScan';
import { type OpenSystemSettings } from './createOpenSystemSettings';

type BluetoothDeps = {
    bluetoothInit: () => Promise<void>;
    backgroundScan: BackgroundScan;
    openSystemSettings: OpenSystemSettings;
};

export type Bluetooth = {
    init: () => Promise<void>;
    restartBackgroundScan: () => void;
    openSystemSettings: OpenSystemSettings;
};

export type BluetoothDep = {
    bluetooth: Bluetooth;
};

export const injectBluetooth = (services: BluetoothDep): BluetoothDep => ({
    bluetooth: services.bluetooth,
});

export const createBluetooth = (deps: BluetoothDeps): Bluetooth => ({
    init: deps.bluetoothInit,
    restartBackgroundScan: deps.backgroundScan.restartIfNeeded,
    openSystemSettings: deps.openSystemSettings,
});
