import { BLUETOOTH_PREFIX } from '@suite-common/bluetooth';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import TrezorConnect, { Device } from '@trezor/connect';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

type BluetoothConnectDeviceThunkResult = {
    success: boolean;
};

export const bluetoothConnectDeviceThunk = createThunk<
    BluetoothConnectDeviceThunkResult,
    { id: string },
    void
>(
    `${BLUETOOTH_PREFIX}/bluetoothConnectDeviceThunk`,
    async ({ id }, { fulfillWithValue, dispatch }) => {
        const result = await bluetoothIpc.connectDevice(id);
        console.log('_____calling: bluetoothIpc.connectDevice(id)', id);

        if (!result.success) {
            // This can fail, but we are silent about this as the device may not be there anymore
            await bluetoothIpc.disconnectDevice(id);

            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: result.error,
                }),
            );

            return fulfillWithValue({ success: result.success });
        }

        // wait for device handshake in @trezor/connect
        await new Promise<void>(resolve => {
            const closeViewAfterConnection = (device: Device) => {
                if (device.bluetoothProps?.id !== id) {
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

        return fulfillWithValue({ success: result.success });
    },
);
