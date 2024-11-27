import { BLUETOOTH_PREFIX, bluetoothActions, selectKnownDevices } from '@suite-common/bluetooth';
import { createThunk } from '@suite-common/redux-utils/';
import { notificationsActions } from '@suite-common/toast-notifications';
import { BluetoothDevice, bluetoothIpc } from '@trezor/transport-bluetooth';

import { remapKnownDevicesForLinux } from './remapKnownDevicesForLinux';
import { selectSuiteFlags } from '../../reducers/suite/suiteReducer';

export const initBluetoothThunk = createThunk<void, void, void>(
    `${BLUETOOTH_PREFIX}/initBluetoothThunk`,
    async (_, { getState, dispatch }) => {
        const { isBluetoothEnabled } = selectSuiteFlags(getState());

        if (!isBluetoothEnabled) {
            return;
        }

        const knownDevices = selectKnownDevices<BluetoothDevice>(getState());
        const result = await bluetoothIpc.init({ knownDevices });
        if (!result.success) {
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: 'Unable to initialize Bluetooth Module.',
                }),
            );

            return;
        }

        bluetoothIpc.on('adapter-event', status => {
            console.warn('adapter-event', status);
            dispatch(bluetoothActions.adapterEventAction({ status }));
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
    },
);
