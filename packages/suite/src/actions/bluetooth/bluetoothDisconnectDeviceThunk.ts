import { BLUETOOTH_PREFIX, bluetoothActions } from '@suite-common/bluetooth';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

type BluetoothDisconnectDeviceThunkResult = {
    success: boolean;
};

export const bluetoothDisconnectDeviceThunk = createThunk<
    BluetoothDisconnectDeviceThunkResult,
    { id: string },
    void
>(
    `${BLUETOOTH_PREFIX}/bluetoothDisconnectDeviceThunk`,
    async ({ id }, { fulfillWithValue, dispatch }) => {
        console.log('_____calling: bluetoothIpc.disconnectDevice(id)', id);
        const result = await bluetoothIpc.disconnectDevice(id);

        if (!result.success) {
            console.log('__FAIL!!!: bluetoothIpc.disconnectDevice(id)', id, result.error);
            dispatch(
                bluetoothActions.updateDeviceConnectionStatus({
                    deviceId: id,
                    connectionStatus: { type: 'disconnected' },
                }),
            );

            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: result.error,
                }),
            );
        } else {
            console.log('_____SUCCESS!!!: bluetoothIpc.disconnectDevice(id)', id);
        }

        return fulfillWithValue({ success: result.success });
    },
);
