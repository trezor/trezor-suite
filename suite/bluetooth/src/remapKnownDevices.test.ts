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

const advertisedManufacturerData: BluetoothManufacturerData = {
    deviceModel: DeviceModelInternal.T3T1,
    deviceColor: 2,
    filterPolicy: {
        pairing: true,
        connected: false,
        bond_memory_full: false,
        user_disconnected: false,
    },
};

const unknownManufacturerData: BluetoothManufacturerData = {
    deviceModel: DeviceModelInternal.UNKNOWN,
    deviceColor: 1,
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
        const { knownDevices: result } = remapKnownDevices({
            nearbyDevices: [nearbyDeviceA, nearbyDeviceC],
            knownDevices: [knownDeviceA, knownDeviceB],
        });

        const expectedDevice: DesktopBluetoothDevice = {
            macAddress: 'Address-Trezor-A-Staying-Same',
            manufacturerData,
            id: asBluetoothDeviceId('New-Id-A'),
            lastUpdatedTimestamp: 1,
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
            const { knownDevices: result } = remapKnownDevices({
                knownDevices: [knownDeviceA],
                nearbyDevices: [{ ...knownDeviceA, connectionStatus }],
            });

            expect(result).toEqual([{ ...knownDeviceA, connectionStatus }]);
        },
    );

    it('keeps a known device in pairing-error state, so the UI can offer pairing again', () => {
        const connectionStatus: DesktopBluetoothDevice['connectionStatus'] = {
            type: 'pairing-error',
            error: 'Pairing failed',
        };

        const result = remapKnownDevices({
            knownDevices: [knownDeviceA],
            nearbyDevices: [{ ...nearbyDeviceA, connectionStatus }],
        });

        expect(result.knownDevices).toEqual([
            {
                ...knownDeviceA,
                id: nearbyDeviceA.id,
                connectionStatus,
                lastUpdatedTimestamp: nearbyDeviceA.lastUpdatedTimestamp,
            },
        ]);
    });

    describe('manufacturerData', () => {
        it('takes the advertised manufacturerData from the nearby device', () => {
            const { knownDevices: result, nearbyDevices } = remapKnownDevices({
                knownDevices: [knownDeviceA],
                nearbyDevices: [{ ...nearbyDeviceA, manufacturerData: advertisedManufacturerData }],
            });

            expect(result.map(device => device.manufacturerData)).toEqual([
                advertisedManufacturerData,
            ]);
            expect(nearbyDevices.map(device => device.manufacturerData)).toEqual([
                advertisedManufacturerData,
            ]);
        });

        it('takes the advertised manufacturerData without an ID change', () => {
            const { knownDevices: result } = remapKnownDevices({
                knownDevices: [knownDeviceA],
                nearbyDevices: [{ ...knownDeviceA, manufacturerData: advertisedManufacturerData }],
            });

            expect(result.map(device => device.manufacturerData)).toEqual([
                advertisedManufacturerData,
            ]);
        });

        it.each([
            ['an ID change', nearbyDeviceA],
            ['no ID change', knownDeviceA],
        ])(
            'keeps the saved manufacturerData when the nearby model is UNKNOWN with %s',
            (_, advertisingDevice) => {
                const { knownDevices: result, nearbyDevices } = remapKnownDevices({
                    knownDevices: [knownDeviceA],
                    nearbyDevices: [
                        { ...advertisingDevice, manufacturerData: unknownManufacturerData },
                    ],
                });

                expect(result.map(device => device.manufacturerData)).toEqual([
                    knownDeviceA.manufacturerData,
                ]);
                expect(nearbyDevices.map(device => device.manufacturerData)).toEqual([
                    knownDeviceA.manufacturerData,
                ]);
            },
        );

        it.each([
            ['an ID change', nearbyDeviceA],
            ['no ID change', knownDeviceA],
        ])(
            'takes only the advertised filterPolicy when the nearby model is UNKNOWN with %s',
            (_, advertisingDevice) => {
                const { filterPolicy } = advertisedManufacturerData;

                const { knownDevices: result, nearbyDevices } = remapKnownDevices({
                    knownDevices: [knownDeviceA],
                    nearbyDevices: [
                        {
                            ...advertisingDevice,
                            manufacturerData: { ...unknownManufacturerData, filterPolicy },
                        },
                    ],
                });

                const expected = { ...knownDeviceA.manufacturerData, filterPolicy };

                expect(result.map(device => device.manufacturerData)).toEqual([expected]);
                expect(nearbyDevices.map(device => device.manufacturerData)).toEqual([expected]);
            },
        );

        it('does not change the manufacturerData of unknown nearby devices', () => {
            const { nearbyDevices } = remapKnownDevices({
                knownDevices: [knownDeviceB],
                nearbyDevices: [{ ...nearbyDeviceC, manufacturerData: unknownManufacturerData }],
            });

            expect(nearbyDevices.map(device => device.manufacturerData)).toEqual([
                unknownManufacturerData,
            ]);
        });
    });

    it('refreshes status and liveness and preserves saved metadata when remapping an OS ID', () => {
        const knownDevice = { ...knownDeviceA, deviceId: 'saved-wallet-id' };
        const nearbyDevice: DesktopBluetoothDevice = {
            ...nearbyDeviceA,
            connectionStatus: { type: 'disconnected' },
            manufacturerData: unknownManufacturerData,
            name: 'Temporary OS name',
            lastUpdatedTimestamp: 100,
            paired: true,
            rssi: -70,
        };

        const { knownDevices: result } = remapKnownDevices({
            knownDevices: [knownDevice],
            nearbyDevices: [nearbyDevice],
        });

        expect(result).toEqual([
            {
                ...knownDevice,
                id: nearbyDevice.id,
                connectionStatus: nearbyDevice.connectionStatus,
                lastUpdatedTimestamp: nearbyDevice.lastUpdatedTimestamp,
                rssi: nearbyDevice.rssi,
            },
        ]);
    });

    it('prefers the remapped ID when the old ID is also in the nearby list', () => {
        const nearbyDevice: DesktopBluetoothDevice = {
            ...nearbyDeviceA,
            connectionStatus: { type: 'disconnected' },
        };
        const { knownDevices: result } = remapKnownDevices({
            knownDevices: [knownDeviceA],
            nearbyDevices: [knownDeviceA, nearbyDevice],
        });

        expect(result).toEqual([
            {
                ...knownDeviceA,
                id: nearbyDevice.id,
                connectionStatus: nearbyDevice.connectionStatus,
                lastUpdatedTimestamp: nearbyDevice.lastUpdatedTimestamp,
            },
        ]);
    });

    it('matches by ID when the nearby MAC address is unavailable', () => {
        const { knownDevices: result } = remapKnownDevices({
            knownDevices: [knownDeviceA],
            nearbyDevices: [
                { ...knownDeviceA, macAddress: '', connectionStatus: { type: 'disconnected' } },
            ],
        });

        expect(result).toEqual([{ ...knownDeviceA, connectionStatus: { type: 'disconnected' } }]);
    });

    it('retains absent known devices without adding unknown nearby devices', () => {
        const { knownDevices: result } = remapKnownDevices({
            knownDevices: [knownDeviceB],
            nearbyDevices: [nearbyDeviceC],
        });

        expect(result).toEqual([knownDeviceB]);
        expect(result[0]).toBe(knownDeviceB);
    });

    it('keeps known devices and their statuses when the nearby list is empty', () => {
        const { knownDevices: result } = remapKnownDevices({
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
            }).knownDevices,
        ).toEqual([]);
    });

    describe('nearbyDevices', () => {
        it('replaces known nearby devices with remapped known ones and keeps the order of the event', () => {
            const knownDevice = { ...knownDeviceA, deviceId: 'saved-wallet-id' };

            const result = remapKnownDevices({
                knownDevices: [knownDevice],
                nearbyDevices: [nearbyDeviceC, nearbyDeviceA],
            });

            expect(result.nearbyDevices).toEqual([
                nearbyDeviceC,
                {
                    ...knownDevice,
                    id: nearbyDeviceA.id,
                    connectionStatus: nearbyDeviceA.connectionStatus,
                    lastUpdatedTimestamp: nearbyDeviceA.lastUpdatedTimestamp,
                },
            ]);
        });

        it('keeps the freshness of the nearby device, so the list is not filtered out as stale', () => {
            const nearbyDevice: DesktopBluetoothDevice = {
                ...nearbyDeviceA,
                lastUpdatedTimestamp: 100,
                rssi: -70,
            };

            const result = remapKnownDevices({
                knownDevices: [knownDeviceA],
                nearbyDevices: [nearbyDevice],
            });

            expect(result.nearbyDevices[0]).toMatchObject({
                id: nearbyDevice.id,
                lastUpdatedTimestamp: 100,
                rssi: -70,
            });
            expect(result.nearbyDevices[0]).toBe(result.knownDevices[0]);
        });

        it('does not add known devices that are not nearby', () => {
            const result = remapKnownDevices({
                knownDevices: [knownDeviceB],
                nearbyDevices: [nearbyDeviceC],
            });

            expect(result.nearbyDevices).toEqual([nearbyDeviceC]);
        });
    });

    it('preserves known-device order regardless of nearby-device order', () => {
        const { knownDevices: result } = remapKnownDevices({
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

        const { knownDevices: result } = remapKnownDevices({ knownDevices, nearbyDevices });

        expect(knownDevices).toEqual(originalKnownDevices);
        expect(nearbyDevices).toEqual(originalNearbyDevices);
        expect(result).not.toBe(knownDevices);
        expect(result[0]).not.toBe(knownDeviceA);
    });
});
