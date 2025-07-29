import { BLUETOOTH_PREFIX } from '@suite-common/bluetooth';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import TrezorConnect, { Device } from '@trezor/connect';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

import {
    setBluetoothDeviceNeedsManualOsRemoval,
    setBluetoothListOpen,
    startConnectingBluetoothDevice,
    stopConnectingBluetoothDevice,
} from './desktopBluetoothReducer';

type BluetoothConnectDeviceThunkResult = {
    success: boolean;
    unpaired?: boolean;
};

export const bluetoothConnectDeviceThunk = createThunk<
    BluetoothConnectDeviceThunkResult,
    { deviceId: string },
    void
>(
    `${BLUETOOTH_PREFIX}/bluetoothConnectDeviceThunk`,
    async ({ deviceId }, { fulfillWithValue, dispatch }) => {
        dispatch(startConnectingBluetoothDevice({ deviceId }));

        console.log('_____calling: bluetoothIpc.connectDevice(id)', deviceId);
        const result = await bluetoothIpc.connectDevice(deviceId);

        if (!result.success) {
            // This can fail, but we are silent about this as the device may not be there anymore
            await bluetoothIpc.disconnectDevice(deviceId);

            // linux: emits DeviceDisconnect right after DeviceConnect but before subscription. Operation already in progress is the error from subscription process
            // macos: connect error Peer removed
            const isUnpaired =
                result.error.includes('Operation already in progress') ||
                result.error.includes('Peer removed pairing information');
            if (isUnpaired) {
                dispatch(setBluetoothDeviceNeedsManualOsRemoval({ needsManualRemoval: true }));
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

        dispatch(stopConnectingBluetoothDevice({ deviceId }));
        dispatch(setBluetoothListOpen({ isOpen: false }));

        return fulfillWithValue({ success: result.success });
    },
);
