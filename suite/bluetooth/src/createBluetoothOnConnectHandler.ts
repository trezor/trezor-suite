import { type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';

import { selectKnownDeviceByDeviceId } from '@suite-common/bluetooth';
import { type WithServices } from '@suite-common/redux-utils';
import { type Device } from '@trezor/connect';

import { type BackgroundScan } from './bluetoothBackgroundScan';
import { type BluetoothDep } from './createBluetooth';
import type { BluetoothDisconnectDevice } from './createBluetoothDisconnectDevice';
import { type WithBluetoothRootState } from './desktopBluetoothReducer';

type BluetoothOnConnectHandlerRootState = WithBluetoothRootState;

type BluetoothOnConnectHandlerThunkDispatch = ThunkDispatch<
    BluetoothOnConnectHandlerRootState,
    WithServices<BluetoothDep>,
    UnknownAction
>;

type BluetoothOnConnectHandlerDeps = {
    getState: () => BluetoothOnConnectHandlerRootState;
    dispatch: BluetoothOnConnectHandlerThunkDispatch;
    backgroundScan: BackgroundScan;
    disconnectDevice: BluetoothDisconnectDevice;
};

export type BluetoothOnConnectHandler = (device: Device) => void;

// called on TrezorConnect DEVICE.CONNECT event
export const createBluetoothOnConnectHandler =
    (deps: BluetoothOnConnectHandlerDeps): BluetoothOnConnectHandler =>
    (device: Device) => {
        const knownDevice = selectKnownDeviceByDeviceId(deps.getState(), device.id ?? undefined);

        // device is re-connected over USB, but the same device is already connected over BT
        // -> disconnect the BT connection
        if (
            device.descriptor.apiType !== 'bluetooth' &&
            knownDevice &&
            (knownDevice.connectionStatus.type === 'connected' ||
                knownDevice.connectionStatus.type === 'connecting')
        ) {
            console.warn('Disconnecting BT device because the same device was connected over USB');
            deps.disconnectDevice({ deviceId: knownDevice.id });
        }
    };
