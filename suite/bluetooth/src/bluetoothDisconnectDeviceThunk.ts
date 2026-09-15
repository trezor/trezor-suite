import { BLUETOOTH_PREFIX, bluetoothActions } from '@suite-common/bluetooth';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type BluetoothDeviceId } from '@trezor/connect';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

import { stopConnectingBluetoothDevice } from './desktopBluetoothReducer';

type BluetoothDisconnectDeviceThunkResult = {
    success: boolean;
};

export const bluetoothDisconnectDeviceThunk = createThunk<
    BluetoothDisconnectDeviceThunkResult,
    { id: BluetoothDeviceId },
    void
>(
    `${BLUETOOTH_PREFIX}/bluetoothDisconnectDeviceThunk`,
    async ({ id }, { fulfillWithValue, dispatch }) => {
        const result = await bluetoothIpc.disconnectDevice(id);

        if (!result.success) {
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
        }

        // just in case if we were in the process of connecting this device
        dispatch(stopConnectingBluetoothDevice({ deviceId: id }));

        return fulfillWithValue({ success: result.success });
    },
);
