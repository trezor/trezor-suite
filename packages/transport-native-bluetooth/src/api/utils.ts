import { type Device } from 'react-native-ble-plx';

import { type BluetoothDevice } from './types';

export const base64ToByteArray = (value: string) => Array.from(Buffer.from(value, 'base64'));

export const toBluetoothDevice = (device: Device): BluetoothDevice => ({
    id: device.id,
    name: device.name ?? 'Unknown',
    // @suite-common utils expect the Bluetooth company identifier (first two bytes) to be trimmed
    manufacturerData: base64ToByteArray(device.manufacturerData ?? '').slice(2),
    lastUpdatedTimestamp: Date.now(),
    connectionStatus: { type: 'disconnected' },
});
