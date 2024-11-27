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

type DeviceConnectionStatusWithOptionalUuid = Without<DeviceConnectionStatus, 'uuid'> & {
    uuid?: string;
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

        const knownDevices = getState().bluetooth.pairedDevices;
        await bluetoothIpc.init({ knownDevices });
    },
);
