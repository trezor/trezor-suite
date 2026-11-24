import { type Dispatch } from '@reduxjs/toolkit';

import { bluetoothActions } from '@suite-common/bluetooth';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type BluetoothDeviceId } from '@trezor/connect';
import { type BluetoothIpcApi } from '@trezor/transport-bluetooth';

import { type BackgroundScan } from './bluetoothBackgroundScan';
import { stopConnectingBluetoothDevice } from './desktopBluetoothReducer';

export type BluetoothDisconnectDeviceDeps = {
    dispatch: Dispatch;
    backgroundScan: BackgroundScan;
    bluetoothIpc: Pick<BluetoothIpcApi, 'disconnectDevice'>;
};

export type BluetoothDisconnectDevice = (deviceId: BluetoothDeviceId) => Promise<void>;

export const createBluetoothDisconnectDevice =
    (deps: BluetoothDisconnectDeviceDeps): BluetoothDisconnectDevice =>
    async deviceId => {
        const result = await deps.bluetoothIpc.disconnectDevice(deviceId);

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
                    error: result.error.message,
                }),
            );
        }

        // just in case if we were in the process of connecting this device
        deps.dispatch(stopConnectingBluetoothDevice({ deviceId }));
    };
