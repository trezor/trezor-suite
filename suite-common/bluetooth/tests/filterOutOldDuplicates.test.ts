import { asBluetoothDeviceId } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';

import { createBluetoothDeviceCommon } from '../mocks';
import { filterOutOldDuplicates } from '../src/filterOutOldDuplicates';
import type { BluetoothDeviceCommon } from '../src/types';
import type { BluetoothManufacturerData } from '../src/types';

const mockedManufacturerData: BluetoothManufacturerData = {
    deviceModel: DeviceModelInternal.T3W1,
    deviceColor: 0,
    filterPolicy: undefined,
};

const mockedManufacturerDataWithFilterPolicy: BluetoothManufacturerData = {
    deviceModel: DeviceModelInternal.T3W1,
    deviceColor: 0,
    filterPolicy: {
        pairing: true,
        connected: false,
        bond_memory_full: false,
        user_disconnected: false,
    },
};

describe(filterOutOldDuplicates.name, () => {
    it('returns all devices if names and props are unique', () => {
        const devices: BluetoothDeviceCommon[] = [
            createBluetoothDeviceCommon({
                id: asBluetoothDeviceId('1'),
                name: 'DeviceA',
                lastUpdatedTimestamp: 100,
                manufacturerData: mockedManufacturerDataWithFilterPolicy,
            }),
            createBluetoothDeviceCommon({
                id: asBluetoothDeviceId('2'),
                name: 'DeviceB',
                lastUpdatedTimestamp: 200,
                manufacturerData: mockedManufacturerDataWithFilterPolicy,
            }),
            createBluetoothDeviceCommon({
                id: asBluetoothDeviceId('3'),
                name: 'DeviceC',
                lastUpdatedTimestamp: 300,
                manufacturerData: mockedManufacturerDataWithFilterPolicy,
            }),
        ];
        const result = filterOutOldDuplicates(devices);
        expect(result).toHaveLength(3);
        expect(result).toEqual(devices);
    });

    it('keeps only the latest device for duplicate names and props', () => {
        const devices: BluetoothDeviceCommon[] = [
            createBluetoothDeviceCommon({
                id: asBluetoothDeviceId('1'),
                name: 'DeviceA',
                lastUpdatedTimestamp: 100,
                manufacturerData: mockedManufacturerDataWithFilterPolicy,
            }),
            createBluetoothDeviceCommon({
                id: asBluetoothDeviceId('2'),
                name: 'DeviceA',
                lastUpdatedTimestamp: 200,
                manufacturerData: mockedManufacturerDataWithFilterPolicy,
            }),
            createBluetoothDeviceCommon({
                id: asBluetoothDeviceId('3'),
                name: 'DeviceB',
                lastUpdatedTimestamp: 150,
                manufacturerData: mockedManufacturerDataWithFilterPolicy,
            }),
        ];
        const result = filterOutOldDuplicates(devices);
        expect(result).toHaveLength(2);
        expect(result).toEqual([
            createBluetoothDeviceCommon({
                id: asBluetoothDeviceId('2'),
                name: 'DeviceA',
                lastUpdatedTimestamp: 200,
                manufacturerData: mockedManufacturerDataWithFilterPolicy,
            }),
            createBluetoothDeviceCommon({
                id: asBluetoothDeviceId('3'),
                name: 'DeviceB',
                lastUpdatedTimestamp: 150,
                manufacturerData: mockedManufacturerDataWithFilterPolicy,
            }),
        ]);
    });

    it('handles multiple sets of duplicates', () => {
        const devices: BluetoothDeviceCommon[] = [
            createBluetoothDeviceCommon({
                id: asBluetoothDeviceId('1'),
                name: 'DeviceA',
                lastUpdatedTimestamp: 100,
                manufacturerData: mockedManufacturerDataWithFilterPolicy,
            }),
            createBluetoothDeviceCommon({
                id: asBluetoothDeviceId('2'),
                name: 'DeviceA',
                lastUpdatedTimestamp: 200,
                manufacturerData: mockedManufacturerDataWithFilterPolicy,
            }),
            createBluetoothDeviceCommon({
                id: asBluetoothDeviceId('3'),
                name: 'DeviceB',
                lastUpdatedTimestamp: 150,
                manufacturerData: mockedManufacturerDataWithFilterPolicy,
            }),
            createBluetoothDeviceCommon({
                id: asBluetoothDeviceId('4'),
                name: 'DeviceB',
                lastUpdatedTimestamp: 250,
                manufacturerData: mockedManufacturerDataWithFilterPolicy,
            }),
            createBluetoothDeviceCommon({
                id: asBluetoothDeviceId('5'),
                name: 'DeviceC',
                lastUpdatedTimestamp: 300,
                manufacturerData: mockedManufacturerDataWithFilterPolicy,
            }),
        ];
        const result = filterOutOldDuplicates(devices);
        expect(result).toHaveLength(3);
        expect(result).toEqual([
            createBluetoothDeviceCommon({
                id: asBluetoothDeviceId('2'),
                name: 'DeviceA',
                lastUpdatedTimestamp: 200,
                manufacturerData: mockedManufacturerDataWithFilterPolicy,
            }),
            createBluetoothDeviceCommon({
                id: asBluetoothDeviceId('4'),
                name: 'DeviceB',
                lastUpdatedTimestamp: 250,
                manufacturerData: mockedManufacturerDataWithFilterPolicy,
            }),
            createBluetoothDeviceCommon({
                id: asBluetoothDeviceId('5'),
                name: 'DeviceC',
                lastUpdatedTimestamp: 300,
                manufacturerData: mockedManufacturerDataWithFilterPolicy,
            }),
        ]);
    });

    it('keeps the duplicated devices if filterPolicy.pairing is false or undefined', () => {
        const devices: BluetoothDeviceCommon[] = [
            createBluetoothDeviceCommon({
                id: asBluetoothDeviceId('1'),
                name: 'DeviceA',
                lastUpdatedTimestamp: 100,
                manufacturerData: {
                    ...mockedManufacturerDataWithFilterPolicy,
                    filterPolicy: {
                        pairing: false,
                        connected: false,
                        bond_memory_full: false,
                        user_disconnected: false,
                    },
                },
            }),
            createBluetoothDeviceCommon({
                id: asBluetoothDeviceId('2'),
                name: 'DeviceA',
                lastUpdatedTimestamp: 200,
            }),
            createBluetoothDeviceCommon({
                id: asBluetoothDeviceId('3'),
                name: 'DeviceB',
                lastUpdatedTimestamp: 150,
            }),
        ];
        const result = filterOutOldDuplicates(devices);
        expect(result).toHaveLength(3);
        expect(result).toEqual(devices);
    });

    it('keeps the duplicated devices if filterPolicy is undefined', () => {
        const devices: BluetoothDeviceCommon[] = [
            createBluetoothDeviceCommon({
                id: asBluetoothDeviceId('1'),
                name: 'DeviceA',
                lastUpdatedTimestamp: 100,
                manufacturerData: mockedManufacturerData,
            }),
            createBluetoothDeviceCommon({
                id: asBluetoothDeviceId('2'),
                name: 'DeviceA',
                lastUpdatedTimestamp: 200,
                manufacturerData: mockedManufacturerData,
            }),
            createBluetoothDeviceCommon({
                id: asBluetoothDeviceId('3'),
                name: 'DeviceB',
                lastUpdatedTimestamp: 150,
                manufacturerData: mockedManufacturerData,
            }),
        ];
        const result = filterOutOldDuplicates(devices);
        expect(result).toHaveLength(3);
        expect(result).toEqual(devices);
    });

    it('returns empty array if input is empty', () => {
        const devices: BluetoothDeviceCommon[] = [];
        const result = filterOutOldDuplicates(devices);
        expect(result).toEqual([]);
    });
});
