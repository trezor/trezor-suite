import { type BluetoothManufacturerData } from '@suite-common/bluetooth';
import { asBluetoothDeviceId } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';

import { type DesktopBluetoothDevice } from '../DesktopBluetoothDevice';
import { remapKnownDevicesForLinuxAndWindows } from '../remapKnownDevicesForLinuxAndWindows';

const manufacturerData: BluetoothManufacturerData = {
    deviceModel: DeviceModelInternal.T3W1,
    deviceColor: 0,
    filterPolicy: undefined,
};

const nearbyDeviceA: DesktopBluetoothDevice = {
    id: asBluetoothDeviceId('New-Id-A'),
    manufacturerData,
    name: 'Trezor A',
    lastUpdatedTimestamp: 1,
    macAddress: 'Address-Trezor-A-Staying-Same',
    paired: false,
    rssi: 0,
    connectionStatus: { type: 'pairing' },
};

const nearbyDeviceC: DesktopBluetoothDevice = {
    id: asBluetoothDeviceId('C'),
    manufacturerData,
    name: 'Trezor C',
    lastUpdatedTimestamp: 1,
    macAddress: 'Address-Trezor-C',
    paired: false,
    rssi: 0,
    connectionStatus: { type: 'pairing' },
};

const knownDeviceB: DesktopBluetoothDevice = {
    id: asBluetoothDeviceId('B'),
    manufacturerData,
    name: 'Trezor A',
    lastUpdatedTimestamp: 1,
    macAddress: 'Address-Trezor-B',
    paired: false,
    rssi: 0,
    connectionStatus: { type: 'pairing' },
};

const knownDeviceA: DesktopBluetoothDevice = {
    id: asBluetoothDeviceId('Original-Id A'),
    manufacturerData,
    name: 'Trezor B',
    lastUpdatedTimestamp: 2,
    macAddress: 'Address-Trezor-A-Staying-Same',
    paired: false,
    rssi: 0,
    connectionStatus: { type: 'pairing' },
};

describe(remapKnownDevicesForLinuxAndWindows.name, () => {
    it('remaps the changed id of the device, while leaving the others intact', () => {
        const result = remapKnownDevicesForLinuxAndWindows({
            nearbyDevices: [nearbyDeviceA, nearbyDeviceC],
            knownDevices: [knownDeviceA, knownDeviceB],
        });

        const expectedDevice: DesktopBluetoothDevice = {
            macAddress: 'Address-Trezor-A-Staying-Same',
            manufacturerData,
            id: asBluetoothDeviceId('New-Id-A'),
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
