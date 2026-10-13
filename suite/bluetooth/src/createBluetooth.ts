import type { BackgroundScan } from './bluetoothBackgroundScan';
import type { BluetoothScan } from './createBluetoothScan';
import type { BluetoothUnpair } from './createBluetoothUnpair';

type BluetoothDeps = {
    bluetoothInit: () => Promise<void>;
    backgroundScan: BackgroundScan;
    scan: BluetoothScan;
    suspendHandler: () => void;
    unpair: BluetoothUnpair;
};

export type Bluetooth = {
    init: () => Promise<void>;
    startScan: BluetoothScan['start'];
    stopScan: BluetoothScan['stop'];
    setScanStatus: BluetoothScan['setStatus'];
    restartBackgroundScan: () => void;
    onPowerSuspend: () => void;
    forgetDevice: BluetoothUnpair['forgetDevice'];
    forgetAllDevices: BluetoothUnpair['forgetAllDevices'];
    unpairCurrentBond: BluetoothUnpair['unpairCurrentBond'];
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
    onPowerSuspend: () => deps.suspendHandler(),
    forgetDevice: deps.unpair.forgetDevice,
    forgetAllDevices: deps.unpair.forgetAllDevices,
    unpairCurrentBond: deps.unpair.unpairCurrentBond,
});
