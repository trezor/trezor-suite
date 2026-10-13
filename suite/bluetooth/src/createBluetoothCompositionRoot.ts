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
import { toGetter } from '@trezor/dependency-injection';
import { type WithServices } from '@trezor/redux-utils';

import { type DesktopBluetoothDevice } from './DesktopBluetoothDevice';
import { createBackgroundScan } from './bluetoothBackgroundScan';
import { type Bluetooth, type BluetoothDep, createBluetooth } from './createBluetooth';
import { createBluetoothConnectDevice } from './createBluetoothConnectDevice';
import { createBluetoothDisconnectDevice } from './createBluetoothDisconnectDevice';
import { createBluetoothInit } from './createBluetoothInit';
import { createBluetoothOnConnectHandler } from './createBluetoothOnConnectHandler';
import { createBluetoothRemoveStaleDevices } from './createBluetoothRemoveStaleDevices';
import { createBluetoothScan } from './createBluetoothScan';
import { createBluetoothUnpair } from './createBluetoothUnpair';
import { createSetupBluetoothAutoReconnect } from './createSetupBluetoothAutoReconnect';
import { createSetupBluetoothListeners } from './createSetupBluetoothListeners';
import { createSuspendHandler } from './createSuspendHandler';
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

export const injectBluetooth = (services: BluetoothDep): BluetoothDep => ({
    bluetooth: services.bluetooth,
});

export const createBluetoothCompositionRoot = (deps: CompositionRootDeps): Bluetooth => {
    const getAdapterStatus = toGetter(deps.getState, selectAdapterStatus);
    const getKnownDevices = toGetter(deps.getState, selectKnownDevices<DesktopBluetoothDevice>);

    const bluetoothScan = createBluetoothScan(deps);

    const backgroundScan = createBackgroundScan({
        getAdapterStatus,
        getKnownDevices,
    });

    const setupBluetoothListeners = createSetupBluetoothListeners({
        getKnownDevices,
        dispatch: deps.dispatch,
        backgroundScan,
    });

    const connectDevice = createBluetoothConnectDevice({
        getState: deps.getState,
        dispatch: deps.dispatch,
        backgroundScan,
    });

    const disconnectDevice = createBluetoothDisconnectDevice({
        getState: deps.getState,
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
        connectDevice,
    });

    const bluetoothInit = createBluetoothInit({
        dispatch: deps.dispatch,
        getKnownDevices,
        setupBluetoothListeners,
        setupBluetoothAutoReconnect,
    });

    const suspendHandler = createSuspendHandler({
        dispatch: deps.dispatch,
        getState: deps.getState,
        backgroundScan,
        disconnectDevice,
    });

    const bluetoothUnpair = createBluetoothUnpair({
        getState: deps.getState,
        dispatch: deps.dispatch,
        backgroundScan,
        disconnectDevice,
    });

    const onConnectHandler = createBluetoothOnConnectHandler({
        getState: deps.getState,
        dispatch: deps.dispatch,
        backgroundScan,
        disconnectDevice,
    });

    const removeStaleDevices = createBluetoothRemoveStaleDevices({
        getState: deps.getState,
        dispatch: deps.dispatch,
    });

    return createBluetooth({
        bluetoothInit,
        backgroundScan,
        scan: bluetoothScan,
        suspendHandler,
        unpair: bluetoothUnpair,
        onConnectHandler,
        connectDevice,
        disconnectDevice,
        removeStaleDevices,
    });
};
