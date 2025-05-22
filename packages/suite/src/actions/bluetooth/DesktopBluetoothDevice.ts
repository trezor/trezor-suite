import { BluetoothManufacturerData, serializeManufacturerData } from '@suite-common/bluetooth';
import { BluetoothDevice } from '@trezor/transport-bluetooth';

export type DesktopBluetoothDevice = Omit<BluetoothDevice, 'data'> & {
    manufacturerData: BluetoothManufacturerData;
};

export const toBluetoothDevice = (device: DesktopBluetoothDevice): BluetoothDevice => ({
    id: device.id,
    name: device.name,
    macAddress: device.macAddress,
    data: serializeManufacturerData(device.manufacturerData),
    connected: device.connected,
    connectionStatus: device.connectionStatus,
    lastUpdatedTimestamp: device.lastUpdatedTimestamp,
    paired: device.paired,
    rssi: device.rssi,
});
