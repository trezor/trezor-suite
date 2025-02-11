import { BluetoothManufacturerData } from '@suite-common/bluetooth';
import { BluetoothDevice as TransportBluetoothDevice } from '@trezor/transport-native-bluetooth';

export type BluetoothPermissionStatus =
    | 'unavailable'
    | 'requested'
    | 'denied'
    | 'blocked'
    | 'granted'
    | 'limited';

export type BluetoothDevice = Omit<TransportBluetoothDevice, 'manufacturerData'> & {
    manufacturerData: BluetoothManufacturerData;
};
