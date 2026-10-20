import { type BackgroundScan } from './bluetoothBackgroundScan';
import { type BluetoothConnectDevice } from './createBluetoothConnectDevice';
import { type BluetoothDisconnectDevice } from './createBluetoothDisconnectDevice';
import { type BluetoothOnConnectHandler } from './createBluetoothOnConnectHandler';
import { type BluetoothScan } from './createBluetoothScan';
import { type BluetoothUnpair } from './createBluetoothUnpair';

type BluetoothDeps = {
    bluetoothInit: () => Promise<void>;
    backgroundScan: BackgroundScan;
    scan: BluetoothScan;
    suspendHandler: () => void;
    unpair: BluetoothUnpair;
    onConnectHandler: BluetoothOnConnectHandler;
    connectDevice: BluetoothConnectDevice;
    disconnectDevice: BluetoothDisconnectDevice;
    removeStaleDevices: () => void;
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
    onConnect: BluetoothOnConnectHandler;
    connectDevice: BluetoothConnectDevice;
    disconnectDevice: BluetoothDisconnectDevice;
    removeStaleDevices: () => void;
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
    onConnect: params => deps.onConnectHandler(params),
    connectDevice: params => deps.connectDevice(params),
    disconnectDevice: params => deps.disconnectDevice(params),
    removeStaleDevices: () => deps.removeStaleDevices(),
});
