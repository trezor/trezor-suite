import { type BluetoothStartScan } from './createBluetoothStartScan';
import { type BluetoothStopScan } from './createBluetoothStopScan';
import { type OpenSystemSettings } from './createOpenSystemSettings';

export type Bluetooth = {
    init: () => Promise<void>;
    restartBackgroundScan: () => void;
    openSystemSettings: OpenSystemSettings;
    startScan: BluetoothStartScan;
    stopScan: BluetoothStopScan;
};

export type BluetoothDep = {
    bluetooth: Bluetooth;
};

export const injectBluetooth = (services: BluetoothDep): BluetoothDep => ({
    bluetooth: services.bluetooth,
});
