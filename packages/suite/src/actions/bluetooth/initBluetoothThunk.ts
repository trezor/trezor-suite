import { BLUETOOTH_PREFIX, bluetoothActions, selectKnownDevices } from '@suite-common/bluetooth';
import { createThunk } from '@suite-common/redux-utils/';
import { BluetoothDevice, DeviceConnectionStatus, bluetoothIpc } from '@trezor/transport-bluetooth';
import { Without } from '@trezor/type-utils';

import { remapKnownDevicesForLinux } from './remapKnownDevicesForLinux';
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
            dispatch(bluetoothActions.adapterEventAction({ isPowered }));
        });

        bluetoothIpc.on('device-list-update', nearbyDevices => {
            console.warn('device-list-update', nearbyDevices);

            const knownDevices = selectKnownDevices<BluetoothDevice>(getState());

            const remappedKnownDevices = remapKnownDevicesForLinux({
                knownDevices,
                nearbyDevices,
            });

            dispatch(
                bluetoothActions.knownDevicesUpdateAction({ knownDevices: remappedKnownDevices }),
            );
            dispatch(bluetoothActions.nearbyDevicesUpdateAction({ nearbyDevices }));
        });

        bluetoothIpc.on('device-connection-status', connectionStatus => {
            console.warn('device-connection-status', connectionStatus);
            const copyConnectionStatus: DeviceConnectionStatusWithOptionalId = {
                ...connectionStatus,
            };
            delete copyConnectionStatus.id; // So we dont pollute redux store

            dispatch(
                bluetoothActions.connectDeviceEventAction({
                    id: connectionStatus.id,
                    connectionStatus: copyConnectionStatus,
                }),
            );
        });

        // TODO: this should be called after trezor/connect init?
        const knownDevices = selectKnownDevices<BluetoothDevice>(getState());
        await bluetoothIpc.init({ knownDevices });
    },
);
