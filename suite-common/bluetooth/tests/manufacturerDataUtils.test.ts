import { DeviceModelInternal } from '@trezor/device-utils';

import { BluetoothFilterPolicy, parseManufacturerData, serializeManufacturerData } from '../src';

describe(parseManufacturerData.name, () => {
    test.each([
        ['empty array', []],
        ['shorter array', [1, 2, 3, 4, 5]],
        ['longer array', [1, 2, 3, 4, 5, 6, 7]],
    ])('parses %s as invalid', (_, bytes) => {
        expect(parseManufacturerData(bytes)).toEqual({
            deviceModel: DeviceModelInternal.UNKNOWN,
            deviceColor: 0,
            filterPolicy: null,
        });
    });

    test('parses invalid data correctly', () => {
        expect(parseManufacturerData([3, 42, 84, 51, 87, 49])).toEqual({
            deviceModel: DeviceModelInternal.UNKNOWN,
            deviceColor: 42,
            filterPolicy: null,
        });
    });

    test('parses valid data correctly', () => {
        expect(parseManufacturerData([1, 42, 49, 87, 51, 84])).toEqual({
            deviceModel: DeviceModelInternal.T3W1,
            deviceColor: 42,
            filterPolicy: BluetoothFilterPolicy.UNFILTERED,
        });
    });
});

describe(serializeManufacturerData.name, () => {
    test('serializes data correctly', () => {
        expect(
            serializeManufacturerData({
                deviceModel: DeviceModelInternal.T3W1,
                deviceColor: 2,
                filterPolicy: BluetoothFilterPolicy.UNFILTERED,
            }),
        ).toEqual([1, 2, 49, 87, 51, 84]);
    });
});
