import { BLUETOOTH_PREFIX, bluetoothActions, selectKnownDevices } from '@suite-common/bluetooth';
import { type WithServices, createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type DesktopApiDep } from '@trezor/suite-desktop-api';
import { type BluetoothDevice, bluetoothIpc } from '@trezor/transport-bluetooth';

import {
    type DesktopBluetoothDevice,
    fromBluetoothDevice,
    toBluetoothDevice,
} from './DesktopBluetoothDevice';
import { type BluetoothDep } from './bluetoothServiceTypes';
import { type WithBluetoothRootState } from './desktopBluetoothReducer';
import { fixLinuxManufacturerData } from './fixLinuxManufacturerData';
import { isBluetoothDeviceReachable } from './isBluetoothDeviceReachable';
import { remapKnownDevicesForLinuxAndWindows } from './remapKnownDevicesForLinuxAndWindows';

type InitBluetoothThunkState = WithBluetoothRootState;

type InitBluetoothThunkDeps = WithServices<
    DesktopApiDep<'openSystemSettings' | 'appFocus'> & BluetoothDep
>;

export const initBluetoothThunk = createThunk<
    void,
    void,
    { state: InitBluetoothThunkState; extra: InitBluetoothThunkDeps }
>(`${BLUETOOTH_PREFIX}/initBluetoothThunk`, async (_, { getState, dispatch, extra }) => {
    const knownDevices = selectKnownDevices<DesktopBluetoothDevice>(getState());

    const result = await bluetoothIpc.init({
        knownDevices: knownDevices.map(device => ({
            ...toBluetoothDevice(device),
            ...{ connected: isBluetoothDeviceReachable(device) },
        })),
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

    bluetoothIpc.on('adapter-event', status => {
        // TODO: check if redux.status != status && status == enabled
        // and fetch bluetoothIpc.getInfo() again
        dispatch(bluetoothActions.adapterEventAction({ status }));
    });

    bluetoothIpc.on('device-list-update', nearbyDevicesIpc => {
        const nearbyDevices = nearbyDevicesIpc.map(fromBluetoothDevice);

        const remappedKnownDevices = remapKnownDevicesForLinuxAndWindows({
            knownDevices: selectKnownDevices<DesktopBluetoothDevice>(getState()),
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
        const settingsOpened = await extra.services.desktopApi.openSystemSettings('bluetooth');
        if (!settingsOpened.success) {
            // stop here and disconnect the device (abort pairing before it starts)
            // this should throw BluetoothSettingsMissing error in current connection process
            // device needs to be paired manually via system settings
            bluetoothIpc.disconnectDevice(id);
        }
    });

    extra.services.bluetooth.init();
});
