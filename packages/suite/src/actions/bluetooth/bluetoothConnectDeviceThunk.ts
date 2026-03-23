import { BLUETOOTH_PREFIX, bluetoothActions } from '@suite-common/bluetooth';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import TrezorConnect, { type BluetoothDeviceId, type Device } from '@trezor/connect';
import { desktopApi } from '@trezor/suite-desktop-api';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

import {
    setBluetoothDeviceNeedsManualPairing,
    startConnectingBluetoothDevice,
    stopConnectingBluetoothDevice,
} from './desktopBluetoothReducer';

type BluetoothConnectDeviceThunkResult = {
    success: boolean;
    unpaired?: boolean;
};

export const bluetoothConnectDeviceThunk = createThunk<
    BluetoothConnectDeviceThunkResult,
    { deviceId: BluetoothDeviceId },
    void
>(
    `${BLUETOOTH_PREFIX}/bluetoothConnectDeviceThunk`,
    async ({ deviceId }, { fulfillWithValue, dispatch }) => {
        dispatch(startConnectingBluetoothDevice({ deviceId }));

        const result = await bluetoothIpc.connectDevice(deviceId);

        // restore focus in case if OS bluetooth setting is opened above the app (linux/mac)
        desktopApi.appFocus();

        if (!result.success) {
            // handling for this error: https://github.com/trezor/trezor-suite/blob/837cdf89c70cca80fd5dabb910e9a8509de7c3b1/packages/transport-bluetooth/src/server/platform/linux.rs#L253
            if (result.error === 'BluetoothSettingsMissing') {
                dispatch(stopConnectingBluetoothDevice({ deviceId }));
                dispatch(setBluetoothDeviceNeedsManualPairing(true));

                return fulfillWithValue({ success: result.success });
            }

            // This can fail, but we are silent about this as the device may not be there anymore
            await bluetoothIpc.disconnectDevice(deviceId);

            // linux: emits DeviceDisconnect right after DeviceConnect but before subscription. Operation already in progress is the error from subscription process
            // macos: connect error Peer removed
            const isUnpaired =
                result.error.includes('Operation already in progress') ||
                result.error.includes('Peer removed pairing information');
            if (isUnpaired) {
                dispatch(bluetoothActions.setIsDeviceOsUnpairingRequired(true));
                dispatch(bluetoothActions.removeKnownDeviceAction({ id: deviceId }));
            } else {
                dispatch(
                    notificationsActions.addToast({
                        type: 'error',
                        error: result.error,
                    }),
                );
            }

            dispatch(stopConnectingBluetoothDevice({ deviceId }));

            return fulfillWithValue({ success: result.success });
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

        dispatch(stopConnectingBluetoothDevice({ deviceId }));

        return fulfillWithValue({ success: result.success });
    },
);
