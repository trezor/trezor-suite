import {
    BLUETOOTH_PREFIX,
    type WithBluetoothState,
    selectKnownDeviceByDeviceId,
} from '@suite-common/bluetooth';
import { type DeviceRootState, selectDevices } from '@suite-common/device';
import { type BluetoothDeviceId, type Device } from '@trezor/connect';
import { createThunk } from '@trezor/redux-utils';

import { type DesktopBluetoothDevice } from './DesktopBluetoothDevice';
import { bluetoothDisconnectDeviceThunk } from './bluetoothDisconnectDeviceThunk';

type BluetoothOnDeviceConnectedThunkState = WithBluetoothState<DesktopBluetoothDevice> &
    DeviceRootState;

// called on DEVICE.CONNECT event
export const bluetoothOnDeviceConnectedThunk = createThunk<
    void,
    Device,
    { state: BluetoothOnDeviceConnectedThunkState }
>(`${BLUETOOTH_PREFIX}/bluetoothOnDeviceConnectedThunk`, (device, { dispatch, getState }) => {
    const knownDevice = selectKnownDeviceByDeviceId(getState(), device.id ?? undefined);

    // device is re-connected over USB, but the same device is already connected over BT
    // -> disconnect the BT connection
    if (
        device.descriptor.apiType !== 'bluetooth' &&
        (knownDevice?.connectionStatus.type === 'connected' ||
            knownDevice?.connectionStatus.type === 'connecting')
    ) {
        console.warn('Disconnecting BT device because the same device was connected over USB');
        dispatch(
            bluetoothDisconnectDeviceThunk({
                id: knownDevice.id,
            }),
        );
    }

    // device is connected over BT, but the same device is already connected over USB
    // -> disconnect the BT connection, so it reconnects once USB is removed
    if (
        device.descriptor.apiType === 'bluetooth' &&
        selectDevices(getState()).some(
            d => d.id === device.id && d.connected && d.descriptor.apiType !== 'bluetooth',
        )
    ) {
        console.warn('Disconnecting BT device because the same device is connected over USB');
        dispatch(
            bluetoothDisconnectDeviceThunk({
                id: device.descriptor.id as BluetoothDeviceId,
            }),
        );
    }
});
