import { type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';

import { type DesktopApiDep } from '@suite/desktop-app-api';
import { type DesktopDeviceRootState } from '@suite/device';
import { type FirmwareRootState } from '@suite-common/firmware';
import { type WithServices } from '@suite-common/redux-utils';

import { createBackgroundScan } from './bluetoothBackgroundScan';
import { type Bluetooth, type BluetoothDep, createBluetooth } from './createBluetooth';
import { createBluetoothAutoReconnect } from './createBluetoothAutoReconnect';
import { createBluetoothInit } from './createBluetoothInit';
import { createBluetoothListeners } from './createBluetoothListeners';
import { createBluetoothScan } from './createBluetoothScan';
import { createBluetoothUnpair } from './createBluetoothUnpair';
import { createSuspendHandler } from './createSuspendHandler';
import { type WithBluetoothRootState } from './desktopBluetoothReducer';

type CompositionRootState = WithBluetoothRootState & DesktopDeviceRootState & FirmwareRootState;

type CompositionRootThunkDispatch = WithServices<
    DesktopApiDep<'openSystemSettings'> & {
        bluetooth: Bluetooth;
    }
>;

type CompositionRootDeps = {
    getState: () => CompositionRootState;
    dispatch: ThunkDispatch<CompositionRootState, CompositionRootThunkDispatch, UnknownAction>;
};

export const injectBluetooth = (services: BluetoothDep): BluetoothDep => ({
    bluetooth: services.bluetooth,
});

export const createBluetoothCompositionRoot = (deps: CompositionRootDeps): Bluetooth => {
    const backgroundScan = createBackgroundScan(deps);
    const bluetoothScan = createBluetoothScan(deps);

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

    const suspendHandler = createSuspendHandler({
        dispatch: deps.dispatch,
        getState: deps.getState,
        backgroundScan,
    });

    const bluetoothUnpair = createBluetoothUnpair({
        getState: deps.getState,
        dispatch: deps.dispatch,
        backgroundScan,
    });

    return createBluetooth({
        bluetoothInit,
        backgroundScan,
        scan: bluetoothScan,
        suspendHandler,
        unpair: bluetoothUnpair,
    });
};
