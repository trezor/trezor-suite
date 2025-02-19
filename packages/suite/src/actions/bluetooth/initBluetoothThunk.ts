import {
    BLUETOOTH_PREFIX,
    bluetoothAdapterEventAction,
    bluetoothConnectDeviceEventAction,
    bluetoothKnownDevicesUpdateAction,
    bluetoothNearbyDevicesUpdateAction,
    selectKnownDevices,
} from '@suite-common/bluetooth';
import { createThunk } from '@suite-common/redux-utils/';
import { BluetoothDevice, DeviceConnectionStatus, bluetoothIpc } from '@trezor/transport-bluetooth';
import { Without } from '@trezor/type-utils';

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

        bluetoothIpc.on('device-list-update', nearbyDevices => {
            console.warn('device-list-update', nearbyDevices);

            const knownDevices = selectKnownDevices<BluetoothDevice>(getState());

            console.log('nearbyDevices', nearbyDevices);

            // update pairedDevices, id is changed after pairing (linux)
            const remappedKnownDevices = knownDevices.map(knownDevice => {
                // find devices with the same address but different id
                const changed = nearbyDevices.find(
                    nearbyDevice =>
                        nearbyDevice.address === knownDevice.address &&
                        nearbyDevice.id !== knownDevice.id,
                );

                return changed ? { ...knownDevice, id: changed.id } : knownDevice;
            });

            dispatch(bluetoothKnownDevicesUpdateAction({ knownDevices: remappedKnownDevices }));
            dispatch(bluetoothNearbyDevicesUpdateAction({ nearbyDevices }));
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
        const knownDevices = selectKnownDevices<BluetoothDevice>(getState());
        await bluetoothIpc.init({ knownDevices });
    },
);
