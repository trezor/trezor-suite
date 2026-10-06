import { type BluetoothManufacturerData } from '@suite-common/bluetooth';
import { asBluetoothDeviceId } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';
import { cloneObject } from '@trezor/utils';

import { type DesktopBluetoothDevice } from './DesktopBluetoothDevice';
import { remapKnownDevices } from './remapKnownDevices';

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

describe(remapKnownDevices.name, () => {
    it('remaps the changed id of the device, while leaving the others intact', () => {
        const result = remapKnownDevices({
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

    const connectionStatuses: DesktopBluetoothDevice['connectionStatus'][] = [
        { type: 'disconnected' },
        { type: 'connected' },
        { type: 'connecting' },
        { type: 'paired' },
        { type: 'pairing', pin: '123456' },
        { type: 'pairing-error', error: 'Pairing failed' },
        { type: 'connection-error', error: 'Device unavailable' },
    ];

    it.each(connectionStatuses)(
        'refreshes status to $type without an ID change',
        connectionStatus => {
            const result = remapKnownDevices({
                knownDevices: [knownDeviceA],
                nearbyDevices: [{ ...knownDeviceA, connectionStatus }],
            });

            expect(result).toEqual([{ ...knownDeviceA, connectionStatus }]);
        },
    );

    it('refreshes status and preserves saved metadata when remapping an OS ID', () => {
        const knownDevice = { ...knownDeviceA, deviceId: 'saved-wallet-id' };
        const nearbyDevice: DesktopBluetoothDevice = {
            ...nearbyDeviceA,
            connectionStatus: { type: 'disconnected' },
            manufacturerData: {
                deviceModel: DeviceModelInternal.UNKNOWN,
                deviceColor: 1,
                filterPolicy: undefined,
            },
            name: 'Temporary OS name',
            lastUpdatedTimestamp: 100,
            paired: true,
            rssi: -70,
        };

        const result = remapKnownDevices({
            knownDevices: [knownDevice],
            nearbyDevices: [nearbyDevice],
        });

        expect(result).toEqual([
            {
                ...knownDevice,
                id: nearbyDevice.id,
                connectionStatus: nearbyDevice.connectionStatus,
            },
        ]);
    });

    it('prefers the remapped ID when the old ID is also in the nearby list', () => {
        const nearbyDevice: DesktopBluetoothDevice = {
            ...nearbyDeviceA,
            connectionStatus: { type: 'disconnected' },
        };
        const result = remapKnownDevices({
            knownDevices: [knownDeviceA],
            nearbyDevices: [knownDeviceA, nearbyDevice],
        });

        expect(result).toEqual([
            {
                ...knownDeviceA,
                id: nearbyDevice.id,
                connectionStatus: nearbyDevice.connectionStatus,
            },
        ]);
    });

    it('matches by ID when the nearby MAC address is unavailable', () => {
        const result = remapKnownDevices({
            knownDevices: [knownDeviceA],
            nearbyDevices: [
                { ...knownDeviceA, macAddress: '', connectionStatus: { type: 'disconnected' } },
            ],
        });

        expect(result).toEqual([{ ...knownDeviceA, connectionStatus: { type: 'disconnected' } }]);
    });

    it('retains absent known devices without adding unknown nearby devices', () => {
        const result = remapKnownDevices({
            knownDevices: [knownDeviceB],
            nearbyDevices: [nearbyDeviceC],
        });

        expect(result).toEqual([knownDeviceB]);
        expect(result[0]).toBe(knownDeviceB);
    });

    it('keeps known devices and their statuses when the nearby list is empty', () => {
        const result = remapKnownDevices({
            knownDevices: [knownDeviceA, knownDeviceB],
            nearbyDevices: [],
        });

        expect(result).toEqual([knownDeviceA, knownDeviceB]);
        expect(result[0]).toBe(knownDeviceA);
        expect(result[1]).toBe(knownDeviceB);
    });

    it('returns no devices when none are known', () => {
        expect(
            remapKnownDevices({
                knownDevices: [],
                nearbyDevices: [nearbyDeviceA, nearbyDeviceC],
            }),
        ).toEqual([]);
    });

    it('preserves known-device order regardless of nearby-device order', () => {
        const result = remapKnownDevices({
            knownDevices: [knownDeviceB, knownDeviceA],
            nearbyDevices: [nearbyDeviceA, knownDeviceB],
        });

        expect(result.map(device => device.id)).toEqual([knownDeviceB.id, nearbyDeviceA.id]);
    });

    it('does not mutate either input list or its devices', () => {
        const knownDevices = [knownDeviceA, knownDeviceB];
        const nearbyDevices = [nearbyDeviceA, nearbyDeviceC];
        const originalKnownDevices = cloneObject(knownDevices);
        const originalNearbyDevices = cloneObject(nearbyDevices);

        const result = remapKnownDevices({ knownDevices, nearbyDevices });

        expect(knownDevices).toEqual(originalKnownDevices);
        expect(nearbyDevices).toEqual(originalNearbyDevices);
        expect(result).not.toBe(knownDevices);
        expect(result[0]).not.toBe(knownDeviceA);
    });
});
