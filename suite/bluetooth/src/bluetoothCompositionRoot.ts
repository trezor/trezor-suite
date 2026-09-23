import { createBackgroundScan } from './bluetoothBackgroundScan';
import { type BluetoothMiddlewareDep, prepareBluetoothMiddleware } from './bluetoothMiddleware';
import { type BluetoothDep, createBluetooth } from './createBluetooth';
import {
    type BluetoothInitDispatch,
    type BluetoothInitRootState,
    createBluetoothInit,
} from './createBluetoothInit';

export type BluetoothCompositionRootDeps = {
    getState: () => BluetoothInitRootState;
    dispatch: BluetoothInitDispatch;
};

type BluetoothCompositionRoot = BluetoothDep & BluetoothMiddlewareDep;

export const createBluetoothCompositionRoot = (
    deps: BluetoothCompositionRootDeps,
): BluetoothCompositionRoot => {
    const backgroundScan = createBackgroundScan({ getState: deps.getState });
    const bluetoothInit = createBluetoothInit({
        getState: deps.getState,
        dispatch: deps.dispatch,
        backgroundScan,
    });

    return {
        bluetooth: createBluetooth({ bluetoothInit }),
        bluetoothMiddleware: prepareBluetoothMiddleware(() => ({ backgroundScan })),
    };
};
