import { type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';

import { type DesktopApiDep } from '@suite/desktop-app-api';
import {
    selectAdapterStatus,
    selectAutoConnectPolicy,
    selectKnownDevices,
} from '@suite-common/bluetooth';
import { type DeviceRootState, selectDevices } from '@suite-common/device';
import { type FirmwareRootState, selectFirmware } from '@suite-common/firmware';
import { type WithServices } from '@suite-common/redux-utils';
import { toGetter } from '@trezor/dependency-injection';

import { type DesktopBluetoothDevice } from './DesktopBluetoothDevice';
import { createBackgroundScan } from './bluetoothBackgroundScan';
import { type Bluetooth, createBluetooth } from './createBluetooth';
import { createBluetoothAutoReconnect } from './createBluetoothAutoReconnect';
import { createBluetoothInit } from './createBluetoothInit';
import { createBluetoothListeners } from './createBluetoothListeners';
import { type WithBluetoothRootState } from './desktopBluetoothReducer';
import { selectConnectingDevices } from './desktopBluetoothSelectors';

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
    const getKnownDevices = toGetter(deps.getState, selectKnownDevices<DesktopBluetoothDevice>);
    const getAdapterStatus = toGetter(deps.getState, selectAdapterStatus);

    const backgroundScan = createBackgroundScan({
        getKnownDevices,
        getAdapterStatus,
    });

    const setupListeners = createBluetoothListeners({
        dispatch: deps.dispatch,
        getKnownDevices,
        backgroundScan,
    });

    const setupAutoReconnect = createBluetoothAutoReconnect({
        dispatch: deps.dispatch,
        getKnownDevices,
        getConnectingDeviceIds: toGetter(deps.getState, selectConnectingDevices),
        getAdapterStatus,
        getAutoConnectPolicy: toGetter(deps.getState, selectAutoConnectPolicy),
        getDevices: toGetter(deps.getState, selectDevices),
        getFirmware: toGetter(deps.getState, selectFirmware),
        backgroundScan,
    });

    const bluetoothInit = createBluetoothInit({
        dispatch: deps.dispatch,
        getKnownDevices,
        setupListeners,
        setupAutoReconnect,
    });

    return createBluetooth({
        bluetoothInit,
        backgroundScan,
    });
};
