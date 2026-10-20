import { selectKnownDeviceByDeviceId } from '@suite-common/bluetooth';
import { type Device } from '@trezor/connect';

import type { BluetoothDisconnectDevice } from './createBluetoothDisconnectDevice';
import { type WithBluetoothRootState } from './desktopBluetoothReducer';

type BluetoothOnConnectHandlerRootState = WithBluetoothRootState;

type BluetoothOnConnectHandlerDeps = {
    getState: () => BluetoothOnConnectHandlerRootState;
    disconnectDevice: BluetoothDisconnectDevice;
};

export type BluetoothOnConnectHandler = (device: Device) => void;

// called on TrezorConnect DEVICE.CONNECT event
export const createBluetoothOnConnectHandler =
    (deps: BluetoothOnConnectHandlerDeps): BluetoothOnConnectHandler =>
    (device: Device) => {
        const knownDevice = selectKnownDeviceByDeviceId(deps.getState(), device.id ?? undefined);

        // device is re-connected over USB, but the same device is already connected over BT
        // -> disconnect the BT connection
        if (
            device.descriptor.apiType !== 'bluetooth' &&
            knownDevice &&
            (knownDevice.connectionStatus.type === 'connected' ||
                knownDevice.connectionStatus.type === 'connecting')
        ) {
            console.warn('Disconnecting BT device because the same device was connected over USB');
            deps.disconnectDevice({ deviceId: knownDevice.id });
        }
    };
