import { BluetoothManufacturerData } from '@suite-common/bluetooth';
import { BluetoothDeviceId } from '@trezor/connect';
import { BluetoothDevice as TransportBluetoothDevice } from '@trezor/transport-native-bluetooth';

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
};
