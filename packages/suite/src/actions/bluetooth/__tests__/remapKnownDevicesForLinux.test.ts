import { BluetoothDevice } from '@trezor/transport-bluetooth';

import { remapKnownDevicesForLinux } from '../remapKnownDevicesForLinux';

const nearbyDeviceA: BluetoothDevice = {
    id: 'New-Id-A',
    data: [],
    name: 'Trezor A',
    lastUpdatedTimestamp: 1,
    address: 'Address-Trezor-A-Staying-Same',
    connected: false,
    paired: false,
    rssi: 0,
};

const nearbyDeviceC: BluetoothDevice = {
    id: 'C',
    data: [],
    name: 'Trezor C',
    lastUpdatedTimestamp: 1,
    address: 'Address-Trezor-C',
    connected: false,
    paired: false,
    rssi: 0,
};

const knownDeviceB: BluetoothDevice = {
    id: 'B',
    data: [],
    name: 'Trezor A',
    lastUpdatedTimestamp: 1,
    address: 'Address-Trezor-B',
    connected: false,
    paired: false,
    rssi: 0,
};

const knownDeviceA: BluetoothDevice = {
    id: 'Original-Id A',
    data: [],
    name: 'Trezor B',
    lastUpdatedTimestamp: 2,
    address: 'Address-Trezor-A-Staying-Same',
    connected: false,
    paired: false,
    rssi: 0,
};

describe(remapKnownDevicesForLinux.name, () => {
    it('remaps the changed id of the device, while leaving the others intact', () => {
        const result = remapKnownDevicesForLinux({
            nearbyDevices: [nearbyDeviceA, nearbyDeviceC],
            knownDevices: [knownDeviceA, knownDeviceB],
        });

        expect(result).toEqual([
            {
                address: 'Address-Trezor-A-Staying-Same',
                connected: false,
                data: [],
                id: 'New-Id-A',
                lastUpdatedTimestamp: 2,
                name: 'Trezor B',
                paired: false,
                rssi: 0,
            },
            knownDeviceB, // Is kept as it is
        ]);
    });
});
