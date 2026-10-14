import { type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';

import { type DesktopApiDep } from '@suite/desktop-app-api';
import { bluetoothActions } from '@suite-common/bluetooth';
import { type WithServices } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import TrezorConnect, { type BluetoothDeviceId, type Device } from '@trezor/connect';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

import {
    type WithBluetoothRootState,
    setBluetoothDeviceNeedsManualPairing,
    startConnectingBluetoothDevice,
    stopConnectingBluetoothDevice,
} from './desktopBluetoothReducer';

type BluetoothConnectDeviceRootState = WithBluetoothRootState;

type BluetoothConnectDeviceThunkDispatch = ThunkDispatch<
    BluetoothConnectDeviceRootState,
    WithServices<DesktopApiDep<'openSystemSettings'>>,
    UnknownAction
>;

type BluetoothConnectDeviceDeps = {
    dispatch: BluetoothConnectDeviceThunkDispatch;
};

export type BluetoothConnectDevice = (params: {
    deviceId: BluetoothDeviceId;
}) => Promise<{ success: boolean }>;

export const createBluetoothConnectDevice =
    (deps: BluetoothConnectDeviceDeps): BluetoothConnectDevice =>
    async ({ deviceId }) => {
        deps.dispatch(startConnectingBluetoothDevice({ deviceId }));
        const result = await bluetoothIpc.connectDevice(deviceId);

        // Restore focus after OS Bluetooth settings opened above the app (Linux/macOS).
        // TODO!!!! deps.desktopApi.appFocus();

        if (!result.success) {
            // handling for this error: https://github.com/trezor/trezor-suite/blob/837cdf89c70cca80fd5dabb910e9a8509de7c3b1/packages/transport-bluetooth/src/server/platform/linux.rs#L253
            if (result.error === 'BluetoothSettingsMissing') {
                deps.dispatch(stopConnectingBluetoothDevice({ deviceId }));
                deps.dispatch(setBluetoothDeviceNeedsManualPairing(true));

                return { success: result.success };
            }

            // This can fail, but we are silent about this as the device may not be there anymore
            await bluetoothIpc.disconnectDevice(deviceId);

            // linux: emits DeviceDisconnect right after DeviceConnect but before subscription. Operation already in progress is the error from subscription process
            // macos: connect error Peer removed
            const isUnpaired =
                result.error.includes('Operation already in progress') ||
                result.error.includes('Peer removed pairing information');
            if (isUnpaired) {
                deps.dispatch(bluetoothActions.setIsDeviceOsUnpairingRequired(true));
                deps.dispatch(bluetoothActions.removeKnownDeviceAction({ id: deviceId }));
            } else {
                deps.dispatch(
                    notificationsActions.addToast({
                        type: 'error',
                        error: result.error,
                    }),
                );
            }

            deps.dispatch(stopConnectingBluetoothDevice({ deviceId }));

            return { success: result.success };
        }

        // wait for device handshake in @trezor/connect
        await new Promise<void>(resolve => {
            const closeViewAfterConnection = (device: Device) => {
                if (
                    device.descriptor.apiType !== 'bluetooth' ||
                    device.descriptor.id !== deviceId
                ) {
                    return;
                }

                TrezorConnect.off('device-connect', closeViewAfterConnection);
                TrezorConnect.off('device-connect_unacquired', closeViewAfterConnection);
                TrezorConnect.off('device-disconnect', closeViewAfterConnection);

                resolve();
            };

            TrezorConnect.on('device-connect', closeViewAfterConnection);
            TrezorConnect.on('device-connect_unacquired', closeViewAfterConnection);
            TrezorConnect.on('device-disconnect', closeViewAfterConnection);
        });

        deps.dispatch(stopConnectingBluetoothDevice({ deviceId }));

        return { success: result.success };
    };
