import { BluetoothFilterPolicy, BluetoothManufacturerData } from '@suite-common/bluetooth';
import { DeviceModelInternal } from '@trezor/device-utils';

import { DesktopBluetoothDevice } from '../DesktopBluetoothDevice';
import { remapKnownDevicesForLinux } from '../remapKnownDevicesForLinux';

const manufacturerData: BluetoothManufacturerData = {
    deviceModel: DeviceModelInternal.T3W1,
    deviceColor: 0,
    filterPolicy: BluetoothFilterPolicy.UNFILTERED,
};

const nearbyDeviceA: DesktopBluetoothDevice = {
    id: 'New-Id-A',
    manufacturerData,
    name: 'Trezor A',
    lastUpdatedTimestamp: 1,
    macAddress: 'Address-Trezor-A-Staying-Same',
    connected: false,
    paired: false,
    rssi: 0,
    connectionStatus: { type: 'pairing' },
};

const nearbyDeviceC: DesktopBluetoothDevice = {
    id: 'C',
    manufacturerData,
    name: 'Trezor C',
    lastUpdatedTimestamp: 1,
    macAddress: 'Address-Trezor-C',
    connected: false,
    paired: false,
    rssi: 0,
    connectionStatus: { type: 'pairing' },
};

const knownDeviceB: DesktopBluetoothDevice = {
    id: 'B',
    manufacturerData,
    name: 'Trezor A',
    lastUpdatedTimestamp: 1,
    macAddress: 'Address-Trezor-B',
    connected: false,
    paired: false,
    rssi: 0,
    connectionStatus: { type: 'pairing' },
};

const knownDeviceA: DesktopBluetoothDevice = {
    id: 'Original-Id A',
    manufacturerData,
    name: 'Trezor B',
    lastUpdatedTimestamp: 2,
    macAddress: 'Address-Trezor-A-Staying-Same',
    connected: false,
    paired: false,
    rssi: 0,
    connectionStatus: { type: 'pairing' },
};

describe(remapKnownDevicesForLinux.name, () => {
    it('remaps the changed id of the device, while leaving the others intact', () => {
        const result = remapKnownDevicesForLinux({
            nearbyDevices: [nearbyDeviceA, nearbyDeviceC],
            knownDevices: [knownDeviceA, knownDeviceB],
        });

        const expectedDevice: DesktopBluetoothDevice = {
            macAddress: 'Address-Trezor-A-Staying-Same',
            connected: false,
            manufacturerData,
            id: 'New-Id-A',
            lastUpdatedTimestamp: 2,
            connectionStatus: {
                type: 'pairing',
            },
            name: 'Trezor B',
            paired: false,
            rssi: 0,
        };

        expect(result).toEqual([
            expectedDevice,
            knownDeviceB, // Is kept as it is
        ]);
    });
});
