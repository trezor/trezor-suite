import { type BluetoothConnectDevice } from './createBluetoothConnectDevice';
import { type BluetoothDisconnectDevice } from './createBluetoothDisconnectDevice';
import { type BluetoothForgetAllDevices } from './createBluetoothForgetAllDevices';
import { type BluetoothForgetDevice } from './createBluetoothForgetDevice';
import { type BluetoothOnDeviceConnected } from './createBluetoothOnDeviceConnected';
import { type BluetoothStartScan } from './createBluetoothStartScan';
import { type BluetoothStopScan } from './createBluetoothStopScan';
import { type BluetoothUnpairCurrentBond } from './createBluetoothUnpairCurrentBond';
import { type OpenSystemSettings } from './createOpenSystemSettings';

export type Bluetooth = {
    init: () => Promise<void>;
    restartBackgroundScan: () => void;
    openSystemSettings: OpenSystemSettings;
    startScan: BluetoothStartScan;
    stopScan: BluetoothStopScan;
    connectDevice: BluetoothConnectDevice;
    onDeviceConnected: BluetoothOnDeviceConnected;
    disconnectDevice: BluetoothDisconnectDevice;
    forgetDevice: BluetoothForgetDevice;
    forgetAllDevices: BluetoothForgetAllDevices;
    unpairCurrentBond: BluetoothUnpairCurrentBond;
};

export type BluetoothDep = {
    bluetooth: Bluetooth;
};

export const injectBluetooth = (services: BluetoothDep): BluetoothDep => ({
    bluetooth: services.bluetooth,
});
