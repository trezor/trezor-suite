import { type Device } from '@trezor/connect';

import { type DesktopBluetoothDevice } from './DesktopBluetoothDevice';
import { type BluetoothDisconnectDevice } from './createBluetoothDisconnectDevice';

type BluetoothOnDeviceConnectedDeps = {
    getKnownDeviceByDeviceId: (deviceId?: string) => DesktopBluetoothDevice | undefined;
    disconnectDevice: BluetoothDisconnectDevice;
};

export type BluetoothOnDeviceConnected = (device: Device) => void;

// called on TrezorConnect DEVICE.CONNECT event
export const createBluetoothOnDeviceConnected =
    (deps: BluetoothOnDeviceConnectedDeps): BluetoothOnDeviceConnected =>
    (device: Device) => {
        const knownDevice = deps.getKnownDeviceByDeviceId(device.id ?? undefined);

        // device is re-connected over USB, but the same device is already connected over BT
        // -> disconnect the BT connection
        if (
            device.descriptor.apiType !== 'bluetooth' &&
            knownDevice &&
            (knownDevice.connectionStatus.type === 'connected' ||
                knownDevice.connectionStatus.type === 'connecting')
        ) {
            console.warn('Disconnecting BT device because the same device was connected over USB');
            void deps.disconnectDevice(knownDevice.id);
        }
    };
