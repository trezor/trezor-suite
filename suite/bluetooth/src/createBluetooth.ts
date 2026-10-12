import type { BackgroundScan } from './bluetoothBackgroundScan';
import type { BluetoothScan } from './createBluetoothScan';

type BluetoothDeps = {
    bluetoothInit: () => Promise<void>;
    backgroundScan: BackgroundScan;
    scan: BluetoothScan;
};

export type Bluetooth = {
    init: () => Promise<void>;
    startScan: BluetoothScan['start'];
    stopScan: BluetoothScan['stop'];
    setScanStatus: BluetoothScan['setStatus'];
    restartBackgroundScan: () => void;
};

export type BluetoothDep = {
    bluetooth: Bluetooth;
};

export const createBluetooth = (deps: BluetoothDeps): Bluetooth => ({
    init: () => deps.bluetoothInit(),
    startScan: () => deps.scan.start(),
    stopScan: () => deps.scan.stop(),
    setScanStatus: status => deps.scan.setStatus(status),
    restartBackgroundScan: () => deps.backgroundScan.restartIfNeeded(),
});
