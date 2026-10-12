import { type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';

import { type DesktopApiDep } from '@suite/desktop-app-api';
import { type DeviceRootState } from '@suite-common/device';
import { type FirmwareRootState } from '@suite-common/firmware';
import { type WithServices } from '@suite-common/redux-utils';

import { createBackgroundScan } from './bluetoothBackgroundScan';
import { type Bluetooth, createBluetooth } from './createBluetooth';
import { createBluetoothAutoReconnect } from './createBluetoothAutoReconnect';
import { createBluetoothInit } from './createBluetoothInit';
import { createBluetoothListeners } from './createBluetoothListeners';
import { type WithBluetoothRootState } from './desktopBluetoothReducer';

type CompositionRootState = WithBluetoothRootState & DeviceRootState & FirmwareRootState;

type CompositionRootThunkDispatch = WithServices<
    DesktopApiDep<'openSystemSettings'> & {
        bluetooth: Bluetooth;
    }
>;

type CompositionRootDeps = {
    getState: () => CompositionRootState;
    dispatch: ThunkDispatch<CompositionRootState, CompositionRootThunkDispatch, UnknownAction>;
};

export const createBluetoothCompositionRoot = (deps: CompositionRootDeps): Bluetooth => {
    const backgroundScan = createBackgroundScan(deps);

    const setupListeners = createBluetoothListeners({
        dispatch: deps.dispatch,
        getState: deps.getState,
        backgroundScan,
    });

    const setupAutoReconnect = createBluetoothAutoReconnect({
        dispatch: deps.dispatch,
        getState: deps.getState,
        backgroundScan,
    });

    const bluetoothInit = createBluetoothInit({
        dispatch: deps.dispatch,
        getState: deps.getState,
        setupListeners,
        setupAutoReconnect,
    });

    return createBluetooth({
        bluetoothInit,
        backgroundScan,
    });
};
