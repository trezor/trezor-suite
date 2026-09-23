import { createBackgroundScan } from './bluetoothBackgroundScan';
import { type Bluetooth, createBluetooth } from './createBluetooth';
import {
    type BluetoothInitDispatch,
    type BluetoothInitRootState,
    createBluetoothInit,
} from './createBluetoothInit';

type BluetoothCompositionRootDeps = {
    getState: () => BluetoothInitRootState;
    dispatch: BluetoothInitDispatch;
};

export const createBluetoothCompositionRoot = (deps: BluetoothCompositionRootDeps): Bluetooth => {
    const backgroundScan = createBackgroundScan({ getState: deps.getState });
    const bluetoothInit = createBluetoothInit({
        getState: deps.getState,
        dispatch: deps.dispatch,
        backgroundScan,
    });

    return createBluetooth({ bluetoothInit, backgroundScan });
};
