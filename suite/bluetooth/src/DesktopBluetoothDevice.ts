import {
    type BluetoothManufacturerData,
    parseManufacturerData,
    serializeManufacturerData,
} from '@suite-common/bluetooth';
import { type BluetoothDeviceId, asBluetoothDeviceId } from '@trezor/connect';
import { type BluetoothDevice } from '@trezor/transport-bluetooth';

// ignore 'connected' as it is abstraction of connectionStatus
export type DesktopBluetoothDevice = Omit<BluetoothDevice, 'data' | 'id' | 'connected'> & {
    manufacturerData: BluetoothManufacturerData;
    id: BluetoothDeviceId;
    deviceId?: string; // Trezor device id (not known for unacquired devices)
};

export const toBluetoothDevice = (
    device: DesktopBluetoothDevice,
): Omit<BluetoothDevice, 'connected'> => ({
    id: device.id,
    name: device.name,
    macAddress: device.macAddress,
    data: serializeManufacturerData(device.manufacturerData),
    connectionStatus: device.connectionStatus,
    lastUpdatedTimestamp: device.lastUpdatedTimestamp,
    paired: device.paired,
    rssi: device.rssi,
});

export const fromBluetoothDevice = (device: BluetoothDevice): DesktopBluetoothDevice => ({
    id: asBluetoothDeviceId(device.id),
    name: device.name,
    macAddress: device.macAddress,
    manufacturerData: parseManufacturerData(device.data),
    connectionStatus: device.connectionStatus,
    lastUpdatedTimestamp: device.lastUpdatedTimestamp,
    paired: device.paired,
    rssi: device.rssi,
});
