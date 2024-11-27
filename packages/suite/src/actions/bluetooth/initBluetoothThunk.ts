import { createThunk } from '@suite-common/redux-utils/';
import { bluetoothManager, DeviceConnectionStatus } from '@trezor/transport-bluetooth';
import { Without } from '@trezor/type-utils';

import {
    BLUETOOTH_PREFIX,
    bluetoothAdapterEventAction,
    bluetoothConnectDeviceEventAction,
    bluetoothDeviceListUpdate,
} from './bluetoothActions';

type DeviceConnectionStatusWithOptionalUuid = Without<DeviceConnectionStatus, 'uuid'> & {
    uuid?: string;
};

export const initBluetoothThunk = createThunk<void, void, void>(
    `${BLUETOOTH_PREFIX}/initBluetoothThunk`,
    (_, { dispatch }) => {
        bluetoothManager.on('adapter-event', isPowered => {
            console.warn('adapter-event', isPowered);
            dispatch(bluetoothAdapterEventAction({ isPowered }));
        });

        bluetoothManager.on('device-list-update', devices => {
            console.warn('device-list-update', devices);
            dispatch(bluetoothDeviceListUpdate({ devices }));
        });

        bluetoothManager.on('device-connection-status', connectionStatus => {
            console.warn('device-connection-status', connectionStatus);
            const copyConnectionStatus: DeviceConnectionStatusWithOptionalUuid = {
                ...connectionStatus,
            };
            delete copyConnectionStatus.uuid; // So we dont pollute redux store

            dispatch(
                bluetoothConnectDeviceEventAction({
                    uuid: connectionStatus.uuid,
                    connectionStatus: copyConnectionStatus,
                }),
            );
        });
    },
);
