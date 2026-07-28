import { DeviceModelInternal } from '@trezor/device-utils';

import { parseManufacturerData, serializeManufacturerData } from './manufacturerDataUtils';

const filterPolicy = {
    pairing: false,
    connected: false,
    bond_memory_full: false,
    user_disconnected: false,
};

describe(parseManufacturerData.name, () => {
    test.each([
        ['empty array', []],
        ['shorter array', [1, 2]],
    ])('parses %s as invalid', (_, bytes) => {
        expect(parseManufacturerData(bytes)).toEqual({
            deviceModel: DeviceModelInternal.UNKNOWN,
            deviceColor: 0,
            filterPolicy: undefined,
        });
    });

    test('parses invalid data correctly', () => {
        expect(parseManufacturerData([31, 42, 84, 51, 87, 49])).toEqual({
            deviceModel: DeviceModelInternal.UNKNOWN,
            deviceColor: 42,
            filterPolicy: {
                pairing: true,
                connected: true,
                bond_memory_full: true,
                user_disconnected: true,
            },
        });
    });

    test('parses valid data correctly', () => {
        expect(parseManufacturerData([1, 0, 6])).toEqual({
            deviceModel: DeviceModelInternal.T3W1,
            deviceColor: 0,
            filterPolicy: {
                ...filterPolicy,
                pairing: true,
            },
        });
        expect(parseManufacturerData([3, 0, 6]).filterPolicy).toEqual({
            pairing: true,
            connected: false,
            bond_memory_full: true,
            user_disconnected: false,
        });
        expect(parseManufacturerData([5, 0, 6]).filterPolicy).toEqual({
            pairing: true,
            connected: true,
            bond_memory_full: false,
            user_disconnected: false,
        });
        expect(parseManufacturerData([6, 0, 6]).filterPolicy).toEqual({
            pairing: false,
            connected: true,
            bond_memory_full: true,
            user_disconnected: false,
        });
        expect(parseManufacturerData([15, 0, 6]).filterPolicy).toEqual({
            pairing: true,
            connected: true,
            bond_memory_full: true,
            user_disconnected: true,
        });

        expect(parseManufacturerData([8, 0, 6]).filterPolicy).toEqual({
            ...filterPolicy,
            user_disconnected: true,
        });
    });
});

describe(serializeManufacturerData.name, () => {
    test('serializes data correctly', () => {
        expect(
            serializeManufacturerData({
                deviceModel: DeviceModelInternal.T3W1,
                deviceColor: 2,
                filterPolicy: {
                    ...filterPolicy,
                    pairing: true,
                },
            }),
        ).toEqual([1, 2, 6]);
    });
});
