import { type Dispatch } from '@reduxjs/toolkit';

import { type DesktopApiDep } from '@suite/desktop-app-api';
import {
    type DesktopDeviceRootState,
    selectDeviceDefaultConnectionMode,
    selectIsConnectionModalOpen,
} from '@suite/device';
import {
    selectAdapterStatus,
    selectAutoConnectPolicy,
    selectKnownDeviceByDeviceId,
    selectKnownDevices,
    selectNearbyDevices,
} from '@suite-common/bluetooth';
import { selectDevices, selectSelectedDevice } from '@suite-common/device';
import { type FirmwareRootState, selectFirmware } from '@suite-common/firmware';
import { toGetter } from '@trezor/dependency-injection';

import { type DesktopBluetoothDevice } from './DesktopBluetoothDevice';
import { createBackgroundScan } from './bluetoothBackgroundScan';
import {
    type BluetoothConnectDevice,
    createBluetoothConnectDevice,
} from './createBluetoothConnectDevice';
import {
    type BluetoothDisconnectDevice,
    createBluetoothDisconnectDevice,
} from './createBluetoothDisconnectDevice';
import {
    type BluetoothForgetAllDevices,
    createBluetoothForgetAllDevices,
} from './createBluetoothForgetAllDevices';
import {
    type BluetoothForgetDevice,
    createBluetoothForgetDevice,
} from './createBluetoothForgetDevice';
import { createBluetoothInit } from './createBluetoothInit';
import {
    type BluetoothOnDeviceConnected,
    createBluetoothOnDeviceConnected,
} from './createBluetoothOnDeviceConnected';
import {
    type BluetoothRemoveStaleDevices,
    createBluetoothRemoveStaleDevices,
} from './createBluetoothRemoveStaleDevices';
import { type BluetoothStartScan, createBluetoothStartScan } from './createBluetoothStartScan';
import { type BluetoothStopScan, createBluetoothStopScan } from './createBluetoothStopScan';
import {
    type BluetoothUnpairCurrentBond,
    createBluetoothUnpairCurrentBond,
} from './createBluetoothUnpairCurrentBond';
import { type OnPowerSuspend, createOnPowerSuspend } from './createOnPowerSuspend';
import { type OpenSystemSettings, createOpenSystemSettings } from './createOpenSystemSettings';
import { createSetupBluetoothAutoReconnect } from './createSetupBluetoothAutoReconnect';
import { createSetupBluetoothListeners } from './createSetupBluetoothListeners';
import { type WithBluetoothRootState } from './desktopBluetoothReducer';
import { selectConnectingDevices } from './desktopBluetoothSelectors';

type CompositionRootState = WithBluetoothRootState & DesktopDeviceRootState & FirmwareRootState;

type CompositionRootDeps = DesktopApiDep<'openSystemSettings'> & {
    getState: () => CompositionRootState;
    dispatch: Dispatch;
};

export type Bluetooth = {
    init: () => Promise<void>;
    restartBackgroundScan: () => void;
    openSystemSettings: OpenSystemSettings;
    onPowerSuspend: OnPowerSuspend;
    startScan: BluetoothStartScan;
    stopScan: BluetoothStopScan;
    connectDevice: BluetoothConnectDevice;
    onDeviceConnected: BluetoothOnDeviceConnected;
    disconnectDevice: BluetoothDisconnectDevice;
    forgetDevice: BluetoothForgetDevice;
    forgetAllDevices: BluetoothForgetAllDevices;
    unpairCurrentBond: BluetoothUnpairCurrentBond;
    removeStaleDevices: BluetoothRemoveStaleDevices;
};

export type BluetoothDep = {
    bluetooth: Bluetooth;
};

export const injectBluetooth = (services: BluetoothDep): BluetoothDep => ({
    bluetooth: services.bluetooth,
});

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

    const connectDevice = createBluetoothConnectDevice({
        dispatch: deps.dispatch,
    });

    const disconnectDevice = createBluetoothDisconnectDevice({
        dispatch: deps.dispatch,
        backgroundScan,
    });

    const onDeviceConnected = createBluetoothOnDeviceConnected({
        getKnownDeviceByDeviceId: toGetter(deps.getState, selectKnownDeviceByDeviceId),
        disconnectDevice,
    });

    const forgetDevice = createBluetoothForgetDevice({
        dispatch: deps.dispatch,
        disconnectDevice,
    });

    const forgetAllDevices = createBluetoothForgetAllDevices({
        dispatch: deps.dispatch,
        backgroundScan,
    });

    const unpairCurrentBond = createBluetoothUnpairCurrentBond({
        getSelectedDevice: toGetter(deps.getState, selectSelectedDevice),
    });

    const onPowerSuspend = createOnPowerSuspend({
        dispatch: deps.dispatch,
        backgroundScan,
        getKnownDevices,
        disconnectDevice,
    });

    const setupBluetoothAutoReconnect = createSetupBluetoothAutoReconnect({
        getKnownDevices,
        getConnectingDeviceIds: toGetter(deps.getState, selectConnectingDevices),
        getAdapterStatus,
        getAutoConnectPolicy: toGetter(deps.getState, selectAutoConnectPolicy),
        getTrezorDevices: toGetter(deps.getState, selectDevices),
        getFirmware: toGetter(deps.getState, selectFirmware),
        backgroundScan,
        connectDevice,
    });

    const bluetoothInit = createBluetoothInit({
        dispatch: deps.dispatch,
        getKnownDevices,
        setupBluetoothListeners,
        setupBluetoothAutoReconnect,
    });

    const removeStaleDevices = createBluetoothRemoveStaleDevices({
        dispatch: deps.dispatch,
        getNearbyDevices: toGetter(deps.getState, selectNearbyDevices),
    });

    return {
        init: bluetoothInit,
        restartBackgroundScan: backgroundScan.restartIfNeeded,
        openSystemSettings,
        onPowerSuspend,
        startScan,
        stopScan,
        connectDevice,
        onDeviceConnected,
        disconnectDevice,
        forgetDevice,
        forgetAllDevices,
        unpairCurrentBond,
        removeStaleDevices,
    };
};
