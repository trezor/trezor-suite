import {
    BLUETOOTH_PREFIX,
    bluetoothActions,
    filterOutOldDuplicatesByName,
    selectAdapterStatus,
    selectKnownDevices,
} from '@suite-common/bluetooth';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { isMacOs } from '@trezor/env-utils';
import { BluetoothDevice, bluetoothIpc } from '@trezor/transport-bluetooth';

import { selectSuiteFlags } from 'src/selectors/suite/suiteSelectors';

import {
    DesktopBluetoothDevice,
    fromBluetoothDevice,
    toBluetoothDevice,
} from './DesktopBluetoothDevice';
import { bluetoothConnectDeviceThunk } from './bluetoothConnectDeviceThunk';
import { bluetoothStartScanningThunk } from './bluetoothStartScanningThunk';
import { selectConnectingDevices } from './desktopBluetoothSelectors';
import { remapKnownDevicesForLinuxAndWindows } from './remapKnownDevicesForLinuxAndWindows';

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

        // NOTE: getInfo when adapter is disabled adapter may return different result in adapter_info field
        const apiInfo = await bluetoothIpc.getInfo();
        if (apiInfo.success) {
            dispatch(
                bluetoothActions.adapterEventAction({
                    status: apiInfo.payload.state,
                }),
            );
        }

        // If we already have some paired devices, we assume user will have a BT device,
        // and therefore we start looking for it.
        if (knownDevices.length > 0) {
            dispatch(bluetoothStartScanningThunk());
        }

        const attemptDeviceConnect = async ({ device }: { device: DesktopBluetoothDevice }) => {
            const knownDevice = selectKnownDevices<DesktopBluetoothDevice>(getState()).find(
                d => d.id === device.id,
            );
            const connectingDevices = selectConnectingDevices(getState());
            const adapterStatus = selectAdapterStatus(getState());

            if (!knownDevice || adapterStatus === 'power-suspending') {
                // system is going to sleep
                return;
            }

            // do not hijack BT connection
            const isConnectable =
                device.connectionStatus.type === 'disconnected' &&
                !device.manufacturerData.filterPolicy?.user_disconnected &&
                !device.manufacturerData.filterPolicy?.pairing;

            if (isConnectable && !connectingDevices.includes(device.id)) {
                await dispatch(bluetoothConnectDeviceThunk({ deviceId: device.id }));
            }
        };

        bluetoothIpc.on('adapter-event', status => {
            // TODO: check if redux.status != status && status == enabled
            // and fetch bluetoothIpc.getInfo() again
            dispatch(bluetoothActions.adapterEventAction({ status }));
        });

        bluetoothIpc.on('device-list-update', nearbyDevicesIpc => {
            const nearbyDevices = nearbyDevicesIpc.map(fromBluetoothDevice);

            const knownDevices = selectKnownDevices<DesktopBluetoothDevice>(getState());

            const remappedKnownDevices = remapKnownDevicesForLinuxAndWindows({
                knownDevices,
                nearbyDevices,
            });

            dispatch(
                bluetoothActions.knownDevicesUpdateAction({
                    knownDevices: isMacOs()
                        ? filterOutOldDuplicatesByName(remappedKnownDevices)
                        : remappedKnownDevices,
                }),
            );
            dispatch(
                bluetoothActions.nearbyDevicesUpdateAction({
                    nearbyDevices: isMacOs()
                        ? filterOutOldDuplicatesByName(nearbyDevices)
                        : nearbyDevices,
                }),
            );
        });

        bluetoothIpc.on('device-update', async (deviceIpc: BluetoothDevice) => {
            const device = fromBluetoothDevice(deviceIpc);
            const knownDevice = selectKnownDevices<DesktopBluetoothDevice>(getState()).find(
                d => d.id === device.id,
            );

            if (knownDevice) {
                // preserve static part of manufacturerData (model, color)
                // incoming data may be empty on linux (after adapter restart)
                device.manufacturerData = {
                    ...knownDevice.manufacturerData,
                    filterPolicy: device.manufacturerData?.filterPolicy,
                };
            }

            dispatch(bluetoothActions.deviceUpdateAction({ device }));
            await attemptDeviceConnect({ device });
        });
    },
);
