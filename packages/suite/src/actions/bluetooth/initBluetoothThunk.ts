import {
    BLUETOOTH_PREFIX,
    bluetoothActions,
    selectConnectingDevices,
    selectKnownDevices,
} from '@suite-common/bluetooth';
import { createThunk } from '@suite-common/redux-utils/';
import { notificationsActions } from '@suite-common/toast-notifications';
import { BluetoothDevice, bluetoothIpc } from '@trezor/transport-bluetooth';

import {
    DesktopBluetoothDevice,
    fromBluetoothDevice,
    toBluetoothDevice,
} from './DesktopBluetoothDevice';
import { bluetoothConnectDeviceThunk } from './bluetoothConnectDeviceThunk';
import { bluetoothStartScanningThunk } from './bluetoothStartScanningThunk';
import { remapKnownDevicesForLinux } from './remapKnownDevicesForLinux';
import { selectSuiteFlags } from '../../reducers/suite/suiteReducer';

export const initBluetoothThunk = createThunk<void, void, void>(
    `${BLUETOOTH_PREFIX}/initBluetoothThunk`,
    async (_, { getState, dispatch }) => {
        const { isBluetoothEnabled } = selectSuiteFlags(getState());

        if (!isBluetoothEnabled) {
            return;
        }

        const knownDevices = selectKnownDevices<DesktopBluetoothDevice>(getState());
        const result = await bluetoothIpc.init({
            knownDevices: knownDevices.map(toBluetoothDevice),
        });

        if (!result.success) {
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: 'Unable to initialize Bluetooth Module.',
                }),
            );

            return;
        }

        // If we already have some paired devices, we assume user will have a BT device,
        // and therefore we start looking for it.
        if (knownDevices.length > 0) {
            dispatch(bluetoothStartScanningThunk());
        }

        const attemptDeviceConnect = async ({ device }: { device: DesktopBluetoothDevice }) => {
            const knownDevices = selectKnownDevices<DesktopBluetoothDevice>(getState());
            const autoConnectingDevices =
                selectConnectingDevices<DesktopBluetoothDevice>(getState());

            if (
                !device.connected &&
                knownDevices.find(d => d.id === device.id) !== undefined &&
                !autoConnectingDevices.includes(device.id)
            ) {
                await dispatch(bluetoothConnectDeviceThunk({ deviceId: device.id }));
            }
        };

        bluetoothIpc.on('adapter-event', status => {
            dispatch(bluetoothActions.adapterEventAction({ status }));
        });

        bluetoothIpc.on('device-list-update', nearbyDevicesIpc => {
            const nearbyDevices = nearbyDevicesIpc.map(fromBluetoothDevice);

            const knownDevices = selectKnownDevices<DesktopBluetoothDevice>(getState());

            const remappedKnownDevices = remapKnownDevicesForLinux({
                knownDevices,
                nearbyDevices,
            });

            dispatch(
                bluetoothActions.knownDevicesUpdateAction({ knownDevices: remappedKnownDevices }),
            );
            dispatch(bluetoothActions.nearbyDevicesUpdateAction({ nearbyDevices }));
        });

        bluetoothIpc.on('device-update', async (deviceIpc: BluetoothDevice) => {
            const device = fromBluetoothDevice(deviceIpc);

            dispatch(bluetoothActions.deviceUpdateAction({ device }));
            await attemptDeviceConnect({ device });
        });
    },
);
