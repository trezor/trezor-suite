import { BLUETOOTH_PREFIX, bluetoothActions } from '@suite-common/bluetooth';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import TrezorConnect, { Device } from '@trezor/connect';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

type BluetoothConnectDeviceThunkResult = {
    success: boolean;
};

export const bluetoothConnectDeviceThunk = createThunk<
    BluetoothConnectDeviceThunkResult,
    { deviceId: string },
    void
>(
    `${BLUETOOTH_PREFIX}/bluetoothConnectDeviceThunk`,
    async ({ deviceId }, { fulfillWithValue, dispatch }) => {
        dispatch(bluetoothActions.startConnectingBluetoothDevice({ deviceId }));

        console.log('_____calling: bluetoothIpc.connectDevice(id)', deviceId);
        const result = await bluetoothIpc.connectDevice(deviceId);

        if (!result.success) {
            // This can fail, but we are silent about this as the device may not be there anymore
            await bluetoothIpc.disconnectDevice(deviceId);

            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: result.error,
                }),
            );

            dispatch(bluetoothActions.stopConnectingBluetoothDevice({ deviceId }));

            return fulfillWithValue({ success: result.success });
        }

        // wait for device handshake in @trezor/connect
        await new Promise<void>(resolve => {
            const closeViewAfterConnection = (device: Device) => {
                if (device.bluetoothProps?.id !== deviceId) {
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

        dispatch(bluetoothActions.stopConnectingBluetoothDevice({ deviceId }));
        dispatch(bluetoothActions.setBluetoothListOpen({ isOpen: false }));

        return fulfillWithValue({ success: result.success });
    },
);
