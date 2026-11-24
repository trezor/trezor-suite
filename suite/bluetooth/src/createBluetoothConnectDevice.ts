import { type Dispatch } from '@reduxjs/toolkit';

import { bluetoothActions } from '@suite-common/bluetooth';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    type BluetoothDeviceId,
    type Device,
    type TrezorConnectPrivilegedAPI,
} from '@trezor/connect';
import { type BluetoothIpcApi } from '@trezor/transport-bluetooth';

import {
    setBluetoothDeviceNeedsManualPairing,
    startConnectingBluetoothDevice,
    stopConnectingBluetoothDevice,
} from './desktopBluetoothReducer';

type BluetoothConnectDeviceDeps = {
    dispatch: Dispatch;
    bluetoothIpc: Pick<BluetoothIpcApi, 'connectDevice' | 'disconnectDevice'>;
    getTrezorConnect: () => Pick<TrezorConnectPrivilegedAPI, 'on' | 'off'>;
};

export type BluetoothConnectDevice = (deviceId: BluetoothDeviceId) => Promise<{ success: boolean }>;

export const createBluetoothConnectDevice =
    (deps: BluetoothConnectDeviceDeps): BluetoothConnectDevice =>
    async deviceId => {
        deps.dispatch(startConnectingBluetoothDevice({ deviceId }));
        const result = await deps.bluetoothIpc.connectDevice(deviceId);

        if (!result.success) {
            const errorMessage = result.error.message;
            // handling for this error: https://github.com/trezor/trezor-suite/blob/837cdf89c70cca80fd5dabb910e9a8509de7c3b1/packages/transport-bluetooth/src/server/platform/linux.rs#L253
            if (errorMessage === 'BluetoothSettingsMissing') {
                deps.dispatch(stopConnectingBluetoothDevice({ deviceId }));
                deps.dispatch(setBluetoothDeviceNeedsManualPairing(true));

                return { success: result.success };
            }

            // This can fail, but we are silent about this as the device may not be there anymore
            await deps.bluetoothIpc.disconnectDevice(deviceId);

            // linux: emits DeviceDisconnect right after DeviceConnect but before subscription. Operation already in progress is the error from subscription process
            // macos: connect error Peer removed
            const isUnpaired =
                errorMessage.includes('Operation already in progress') ||
                errorMessage.includes('Peer removed pairing information');
            if (isUnpaired) {
                deps.dispatch(bluetoothActions.setIsDeviceOsUnpairingRequired(true));
                deps.dispatch(bluetoothActions.removeKnownDeviceAction({ id: deviceId }));
            } else {
                deps.dispatch(
                    notificationsActions.addToast({
                        type: 'error',
                        error: errorMessage,
                    }),
                );
            }

            deps.dispatch(stopConnectingBluetoothDevice({ deviceId }));

            return { success: result.success };
        }

        // wait for device handshake in @trezor/connect
        await new Promise<void>(resolve => {
            const trezorConnect = deps.getTrezorConnect();
            const closeViewAfterConnection = (device: Device) => {
                if (
                    device.descriptor.apiType !== 'bluetooth' ||
                    device.descriptor.id !== deviceId
                ) {
                    return;
                }

                trezorConnect.off('device-connect', closeViewAfterConnection);
                trezorConnect.off('device-connect_unacquired', closeViewAfterConnection);
                trezorConnect.off('device-disconnect', closeViewAfterConnection);

                resolve();
            };

            trezorConnect.on('device-connect', closeViewAfterConnection);
            trezorConnect.on('device-connect_unacquired', closeViewAfterConnection);
            trezorConnect.on('device-disconnect', closeViewAfterConnection);
        });

        deps.dispatch(stopConnectingBluetoothDevice({ deviceId }));

        return { success: result.success };
    };
