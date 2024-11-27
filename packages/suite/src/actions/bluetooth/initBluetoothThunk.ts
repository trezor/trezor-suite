import { createThunk } from '@suite-common/redux-utils/';
import { DeviceConnectionStatus, bluetoothIpc } from '@trezor/transport-bluetooth';
import { Without } from '@trezor/type-utils';

import {
    BLUETOOTH_PREFIX,
    bluetoothAdapterEventAction,
    bluetoothConnectDeviceEventAction,
    bluetoothDeviceListUpdate,
} from './bluetoothActions';
import { selectSuiteFlags } from '../../reducers/suite/suiteReducer';

type DeviceConnectionStatusWithOptionalId = Without<DeviceConnectionStatus, 'id'> & {
    id?: string;
};

export const initBluetoothThunk = createThunk<void, void, void>(
    `${BLUETOOTH_PREFIX}/initBluetoothThunk`,
    async (_, { dispatch, getState }) => {
        const { isBluetoothEnabled } = selectSuiteFlags(getState());

        if (!isBluetoothEnabled) {
            return;
        }

        bluetoothIpc.on('adapter-event', isPowered => {
            console.warn('adapter-event', isPowered);
            dispatch(bluetoothAdapterEventAction({ isPowered }));
        });

        bluetoothIpc.on('device-list-update', devices => {
            console.warn('device-list-update', devices);
            dispatch(bluetoothDeviceListUpdate({ devices }));
        });

        bluetoothIpc.on('device-connection-status', connectionStatus => {
            console.warn('device-connection-status', connectionStatus);
            const copyConnectionStatus: DeviceConnectionStatusWithOptionalId = {
                ...connectionStatus,
            };
            delete copyConnectionStatus.id; // So we dont pollute redux store

            dispatch(
                bluetoothConnectDeviceEventAction({
                    id: connectionStatus.id,
                    connectionStatus: copyConnectionStatus,
                }),
            );
        });

        // TODO: this should be called after trezor/connect init?
        const knownDevices = getState().bluetooth.pairedDevices;
        await bluetoothIpc.init({ knownDevices });
    },
);
