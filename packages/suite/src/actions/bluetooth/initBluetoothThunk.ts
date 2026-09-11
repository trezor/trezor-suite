import { BLUETOOTH_PREFIX, bluetoothActions, selectKnownDevices } from '@suite-common/bluetooth';
import { type DeviceRootState } from '@suite-common/device';
import { type FirmwareRootState } from '@suite-common/firmware';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { desktopApi } from '@trezor/suite-desktop-api';
import { type BluetoothDevice, bluetoothIpc } from '@trezor/transport-bluetooth';

import {
    type DesktopBluetoothDevice,
    fromBluetoothDevice,
    toBluetoothDevice,
} from './DesktopBluetoothDevice';
import { type WithBluetoothRootState } from './desktopBluetoothReducer';
import { fixLinuxManufacturerData } from './fixLinuxManufacturerData';
import { isBluetoothDeviceReachable } from './isBluetoothDeviceReachable';
import { remapKnownDevicesForLinuxAndWindows } from './remapKnownDevicesForLinuxAndWindows';

type InitBluetoothThunkState = DeviceRootState & FirmwareRootState & WithBluetoothRootState;

export const initBluetoothThunk = createThunk<void, void, { state: InitBluetoothThunkState }>(
    `${BLUETOOTH_PREFIX}/initBluetoothThunk`,
    async (_, { getState, dispatch, rejectWithValue }) => {
        const knownDevices = selectKnownDevices<DesktopBluetoothDevice>(getState());

        const result = await bluetoothIpc.init({
            knownDevices: knownDevices.map(device => ({
                ...toBluetoothDevice(device),
                ...{ connected: isBluetoothDeviceReachable(device) },
            })),
        });

        if (!result.success) {
            const errorMessage = 'Unable to initialize Bluetooth Module';
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: errorMessage,
                }),
            );

            return rejectWithValue(errorMessage);
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
                    knownDevices: remappedKnownDevices,
                }),
            );
            dispatch(
                bluetoothActions.nearbyDevicesUpdateAction({
                    nearbyDevices,
                }),
            );
        });

        bluetoothIpc.on('device-update', (deviceIpc: BluetoothDevice) => {
            let device = fromBluetoothDevice(deviceIpc);

            const knownDevice = selectKnownDevices<DesktopBluetoothDevice>(getState()).find(
                d => d.id === device.id,
            );
            device = fixLinuxManufacturerData(device, knownDevice);

            dispatch(bluetoothActions.deviceUpdateAction({ device }));
        });

        bluetoothIpc.on('open-bluetooth-settings', async ({ id }) => {
            const result = await desktopApi.openSystemSettings('bluetooth');
            if (!result.success) {
                // stop here and disconnect the device (abort pairing before it starts)
                // this should throw BluetoothSettingsMissing error in current connection process
                // device needs to be paired manually via system settings
                bluetoothIpc.disconnectDevice(id);
            }
        });

        // see bluetoothMiddleware for auto-reconnect logic
    },
);
