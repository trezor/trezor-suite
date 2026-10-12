import type { BackgroundScan } from './bluetoothBackgroundScan';

type BluetoothDeps = {
    bluetoothInit: () => Promise<void>;
    backgroundScan: BackgroundScan;
};

export type Bluetooth = {
    init: () => Promise<void>;
    restartBackgroundScan: () => void;
};

export type BluetoothDep = {
    bluetooth: Bluetooth;
};

export const createBluetooth = (deps: BluetoothDeps): Bluetooth => ({
    init: () => deps.bluetoothInit(),
    restartBackgroundScan: () => deps.backgroundScan.restartIfNeeded(),
});
