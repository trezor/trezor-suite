import { type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';

import { type DesktopApiDep } from '@suite/desktop-app-api';
import {
    type DesktopDeviceRootState,
    selectDeviceDefaultConnectionMode,
    selectIsConnectionModalOpen,
} from '@suite/device';
import {
    selectAdapterStatus,
    selectAutoConnectPolicy,
    selectKnownDevices,
} from '@suite-common/bluetooth';
import { selectDevices } from '@suite-common/device';
import { type FirmwareRootState, selectFirmware } from '@suite-common/firmware';
import { toGetter } from '@trezor/dependency-injection';
import { type WithServices } from '@trezor/redux-utils';

import { type DesktopBluetoothDevice } from './DesktopBluetoothDevice';
import { createBackgroundScan } from './bluetoothBackgroundScan';
import { type Bluetooth, type BluetoothDep } from './createBluetooth';
import { createBluetoothInit } from './createBluetoothInit';
import { createBluetoothStartScan } from './createBluetoothStartScan';
import { createBluetoothStopScan } from './createBluetoothStopScan';
import { createOpenSystemSettings } from './createOpenSystemSettings';
import { createSetupBluetoothAutoReconnect } from './createSetupBluetoothAutoReconnect';
import { createSetupBluetoothListeners } from './createSetupBluetoothListeners';
import { type WithBluetoothRootState } from './desktopBluetoothReducer';
import { selectConnectingDevices } from './desktopBluetoothSelectors';

type CompositionRootState = WithBluetoothRootState & DesktopDeviceRootState & FirmwareRootState;

type CompositionRootThunkDispatch = WithServices<BluetoothDep>;

type CompositionRootDeps = DesktopApiDep<'openSystemSettings'> & {
    getState: () => CompositionRootState;
    dispatch: ThunkDispatch<CompositionRootState, CompositionRootThunkDispatch, UnknownAction>;
};

export const createBluetoothCompositionRoot = (deps: CompositionRootDeps): Bluetooth => {
    const getAdapterStatus = toGetter(deps.getState, selectAdapterStatus);
    const getKnownDevices = toGetter(deps.getState, selectKnownDevices<DesktopBluetoothDevice>);
    const openSystemSettings = createOpenSystemSettings(deps);

    const backgroundScan = createBackgroundScan({
        getAdapterStatus,
        getKnownDevices,
    });

    const startScan = createBluetoothStartScan({ dispatch: deps.dispatch });

    const stopScan = createBluetoothStopScan({
        dispatch: deps.dispatch,
        getDefaultConnectionMode: toGetter(deps.getState, selectDeviceDefaultConnectionMode),
        getIsConnectionModalOpen: toGetter(deps.getState, selectIsConnectionModalOpen),
    });

    const setupBluetoothListeners = createSetupBluetoothListeners({
        getKnownDevices,
        dispatch: deps.dispatch,
        backgroundScan,
        openSystemSettings,
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

    return {
        init: bluetoothInit,
        restartBackgroundScan: backgroundScan.restartIfNeeded,
        openSystemSettings,
        startScan,
        stopScan,
    };
};
