import { BLUETOOTH_PREFIX } from '@suite-common/bluetooth';
import { type WithServices, createThunk } from '@suite-common/redux-utils';
import { type Device } from '@trezor/connect';

import { type BluetoothDep } from './bluetoothServiceTypes';

type BluetoothOnDeviceDisconnectedThunkDeps = WithServices<BluetoothDep>;

// called on DEVICE.DISCONNECT event
export const bluetoothOnDeviceDisconnectedThunk = createThunk<
    void,
    Device,
    { extra: BluetoothOnDeviceDisconnectedThunkDeps }
>(`${BLUETOOTH_PREFIX}/bluetoothOnDeviceDisconnectedThunk`, (device, { extra }) => {
    if (device.descriptor.apiType === 'bluetooth') {
        extra.services.bluetooth.restartBackgroundScan();
    }
});
