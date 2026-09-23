import { type Middleware } from '@reduxjs/toolkit';

import { createBackgroundScan } from './bluetoothBackgroundScan';
import { prepareBluetoothMiddleware } from './bluetoothMiddleware';
import { type Bluetooth, createBluetooth } from './createBluetooth';
import {
    type BluetoothInitDispatch,
    type BluetoothInitRootState,
    createBluetoothInit,
} from './createBluetoothInit';

export type BluetoothCompositionRootDeps = {
    getState: () => BluetoothInitRootState;
    dispatch: BluetoothInitDispatch;
};

type BluetoothCompositionRoot = {
    bluetooth: Bluetooth;
    bluetoothMiddleware: Middleware;
};

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
