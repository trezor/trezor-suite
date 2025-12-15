import { type BluetoothManufacturerData } from '@suite-common/bluetooth';
import { type BluetoothDeviceId } from '@trezor/connect';
import { type BluetoothDevice as TransportBluetoothDevice } from '@trezor/transport-native-bluetooth';

export type BluetoothPermissionStatus =
    | 'unavailable'
    | 'requested'
    | 'denied'
    | 'blocked'
    | 'granted'
    | 'limited';

export type BluetoothDevice = Omit<TransportBluetoothDevice, 'manufacturerData' | 'id'> & {
    id: BluetoothDeviceId;
    manufacturerData: BluetoothManufacturerData;
    deviceId?: string; // Trezor device id (not known for unacquired devices)
};
