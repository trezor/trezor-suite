import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { bluetoothActions } from '@suite-common/bluetooth';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import TrezorConnect from '@trezor/connect';
import { bluetoothManager } from '@trezor/transport-native-bluetooth';

import { type BluetoothDevice } from '../types';

type UnpairDeviceProps = {
    onSuccess: () => void;
    onCancel: () => void;
};

export const useBluetoothDevice = () => {
    const dispatch = useDispatch();

    const connectBluetoothDevice = useCallback(async (device: BluetoothDevice): Promise<void> => {
        await bluetoothManager.connectDevice({
            deviceId: device.id,
        });
    }, []);

    const removeBluetoothDevice = useCallback(
        (device: BluetoothDevice) => {
            dispatch(bluetoothActions.removeKnownDeviceAction({ id: device.id }));
        },
        [dispatch],
    );

    const unpairBluetoothDevice = useCallback(
        async ({ onSuccess, onCancel }: UnpairDeviceProps): Promise<void> => {
            const result = await requestPrioritizedDeviceAccess(() => TrezorConnect.bleUnpair({}));

            if (!result.success) {
                return;
            }

            const unwrappedResult = result.payload;
            if (unwrappedResult.success || unwrappedResult.error.code === 'Device_Disconnected') {
                dispatch(bluetoothActions.setIsDeviceOsUnpairingRequired(true));
                onSuccess();
            } else if (
                unwrappedResult.error.code === 'Failure_ActionCancelled' ||
                unwrappedResult.error.code === 'Failure_PinCancelled' ||
                unwrappedResult.error.code === 'Method_Interrupted'
            ) {
                onCancel();
            }
        },
        [dispatch],
    );

    return {
        connectBluetoothDevice,
        removeBluetoothDevice,
        unpairBluetoothDevice,
    };
};
