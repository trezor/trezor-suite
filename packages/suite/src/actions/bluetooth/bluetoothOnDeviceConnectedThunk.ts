import { BLUETOOTH_PREFIX } from '@suite-common/bluetooth';
import { selectKnownDeviceByDeviceId } from '@suite-common/bluetooth/src/bluetoothSelectors';
import { createThunk } from '@suite-common/redux-utils';
import { Device } from '@trezor/connect';

import { bluetoothDisconnectDeviceThunk } from './bluetoothDisconnectDeviceThunk';

// called on DEVICE.CONNECT event
export const bluetoothOnDeviceConnectedThunk = createThunk<void, Device, void>(
    `${BLUETOOTH_PREFIX}/bluetoothOnDeviceConnectedThunk`,
    (device, { dispatch, getState }) => {
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
    },
);
