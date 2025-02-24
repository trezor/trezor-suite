import { BLUETOOTH_PREFIX, bluetoothActions } from '@suite-common/bluetooth';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
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

        if (!result.success) {
            dispatch(
                bluetoothActions.connectDeviceEventAction({
                    id,
                    connectionStatus: { type: 'error', error: result.error },
                }),
            );
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: result.error,
                }),
            );
        } else {
            dispatch(
                bluetoothActions.connectDeviceEventAction({
                    id,
                    connectionStatus: { type: 'connected' },
                }),
            );
        }

        return fulfillWithValue({ success: result.success });
    },
);
