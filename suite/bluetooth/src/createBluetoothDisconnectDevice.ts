import { type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';

import { bluetoothActions } from '@suite-common/bluetooth';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type BluetoothDeviceId } from '@trezor/connect';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

import { type BackgroundScan } from './bluetoothBackgroundScan';
import {
    type WithBluetoothRootState,
    stopConnectingBluetoothDevice,
} from './desktopBluetoothReducer';

type BluetoothDisconnectDeviceRootState = WithBluetoothRootState;

type BluetoothDisconnectDeviceThunkDispatch = ThunkDispatch<
    BluetoothDisconnectDeviceRootState,
    unknown,
    UnknownAction
>;

type BluetoothDisconnectDeviceDeps = {
    getState: () => BluetoothDisconnectDeviceRootState;
    dispatch: BluetoothDisconnectDeviceThunkDispatch;
    backgroundScan: BackgroundScan;
};

export type BluetoothDisconnectDevice = (params: { deviceId: BluetoothDeviceId }) => Promise<void>;

export const createBluetoothDisconnectDevice =
    (deps: BluetoothDisconnectDeviceDeps): BluetoothDisconnectDevice =>
    async ({ deviceId }) => {
        const result = await bluetoothIpc.disconnectDevice(deviceId);

        if (!result.success) {
            deps.dispatch(
                bluetoothActions.updateDeviceConnectionStatus({
                    deviceId,
                    connectionStatus: { type: 'disconnected' },
                }),
            );
            deps.backgroundScan.restartIfNeeded();

            deps.dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: result.error,
                }),
            );
        }

        // just in case if we were in the process of connecting this device
        deps.dispatch(stopConnectingBluetoothDevice({ deviceId }));
    };
