import { type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';

import { type DesktopApiDep } from '@suite/desktop-app-api';
import { type DesktopDeviceRootState } from '@suite/device';
import {
    selectAdapterStatus,
    selectAutoConnectPolicy,
    selectKnownDevices,
} from '@suite-common/bluetooth';
import { selectDevices } from '@suite-common/device';
import { type FirmwareRootState, selectFirmware } from '@suite-common/firmware';
import { type WithServices } from '@suite-common/redux-utils';
import { toGetter } from '@trezor/dependency-injection';

import { type DesktopBluetoothDevice } from './DesktopBluetoothDevice';
import { createBackgroundScan } from './bluetoothBackgroundScan';
import { type Bluetooth, type BluetoothDep, createBluetooth } from './createBluetooth';
import { createBluetoothInit } from './createBluetoothInit';
import { createSetupBluetoothAutoReconnect } from './createSetupBluetoothAutoReconnect';
import { createSetupBluetoothListeners } from './createSetupBluetoothListeners';
import { type WithBluetoothRootState } from './desktopBluetoothReducer';
import { selectConnectingDevices } from './desktopBluetoothSelectors';

type CompositionRootState = WithBluetoothRootState & DesktopDeviceRootState & FirmwareRootState;

type CompositionRootThunkDispatch = WithServices<
    DesktopApiDep<'openSystemSettings'> & BluetoothDep
>;

type CompositionRootDeps = {
    getState: () => CompositionRootState;
    dispatch: ThunkDispatch<CompositionRootState, CompositionRootThunkDispatch, UnknownAction>;
};

export const createBluetoothCompositionRoot = (deps: CompositionRootDeps): Bluetooth => {
    const getAdapterStatus = toGetter(deps.getState, selectAdapterStatus);
    const getKnownDevices = toGetter(deps.getState, selectKnownDevices<DesktopBluetoothDevice>);

    const backgroundScan = createBackgroundScan(deps);

    const setupBluetoothListeners = createSetupBluetoothListeners({
        getKnownDevices,
        dispatch: deps.dispatch,
        backgroundScan,
    });

    const setupBluetoothAutoReconnect = createSetupBluetoothAutoReconnect({
        getKnownDevices,
        getConnectingDeviceIds: toGetter(deps.getState, selectConnectingDevices),
        getAdapterStatus,
        getAutoConnectPolicy: toGetter(deps.getState, selectAutoConnectPolicy),
        getTrezorDevices: toGetter(deps.getState, selectDevices),
        getFirmware: toGetter(deps.getState, selectFirmware),
        dispatch: deps.dispatch,
        backgroundScan,
    });

    const bluetoothInit = createBluetoothInit({
        dispatch: deps.dispatch,
        getKnownDevices,
        setupBluetoothListeners,
        setupBluetoothAutoReconnect,
    });

    return createBluetooth({
        bluetoothInit,
        backgroundScan,
    });
};
