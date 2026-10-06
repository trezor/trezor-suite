import { createBackgroundScan } from './bluetoothBackgroundScan';
import { createBluetoothService } from './bluetoothService';
import { type BluetoothService, type BluetoothServiceDeps } from './bluetoothServiceTypes';

export const createBluetoothCompositionRoot = (deps: BluetoothServiceDeps): BluetoothService =>
    createBluetoothService(deps, {
        backgroundScan: createBackgroundScan(deps),
    });
