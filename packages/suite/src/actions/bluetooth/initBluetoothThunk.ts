import { BLUETOOTH_PREFIX, bluetoothActions, selectKnownDevices } from '@suite-common/bluetooth';
import { createThunk } from '@suite-common/redux-utils/';
import { BluetoothDevice, bluetoothIpc } from '@trezor/transport-bluetooth';

import { remapKnownDevicesForLinux } from './remapKnownDevicesForLinux';
import { selectSuiteFlags } from '../../reducers/suite/suiteReducer';

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

        bluetoothIpc.on('device-update', (device: BluetoothDevice) => {
            console.warn('device-update', device);

            dispatch(bluetoothActions.connectDeviceEventAction({ device }));
        });

        // TODO: this should be called after trezor/connect init?
        const knownDevices = selectKnownDevices<BluetoothDevice>(getState());
        await bluetoothIpc.init({ knownDevices });
    },
);
