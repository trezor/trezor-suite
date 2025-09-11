import { DeviceModelInternal } from '@trezor/device-utils';

import { filterOutOldDuplicatesByName } from '../src/filterOutOldDuplicatesByName';
import { BluetoothDeviceCommon } from '../src/types';

const defaultDeviceAdditionalParams: Pick<
    BluetoothDeviceCommon,
    'connectionStatus' | 'manufacturerData'
> = {
    connectionStatus: {
        type: 'disconnected',
    },
    manufacturerData: {
        deviceColor: 1,
        deviceModel: DeviceModelInternal.T3W1,
    },
};

describe(filterOutOldDuplicatesByName.name, () => {
    it('returns all devices if names are unique', () => {
        const devices: BluetoothDeviceCommon[] = [
            {
                id: '1',
                name: 'DeviceA',
                lastUpdatedTimestamp: 100,
                ...defaultDeviceAdditionalParams,
            },
            {
                id: '2',
                name: 'DeviceB',
                lastUpdatedTimestamp: 200,
                ...defaultDeviceAdditionalParams,
            },
            {
                id: '3',
                name: 'DeviceC',
                lastUpdatedTimestamp: 300,
                ...defaultDeviceAdditionalParams,
            },
        ];
        const result = filterOutOldDuplicatesByName(devices);
        expect(result).toHaveLength(3);
        expect(result).toEqual(devices);
    });

    it('keeps only the latest device for duplicate names', () => {
        const devices: BluetoothDeviceCommon[] = [
            {
                id: '1',
                name: 'DeviceA',
                lastUpdatedTimestamp: 100,
                ...defaultDeviceAdditionalParams,
            },
            {
                id: '2',
                name: 'DeviceA',
                lastUpdatedTimestamp: 200,
                ...defaultDeviceAdditionalParams,
            },
            {
                id: '3',
                name: 'DeviceB',
                lastUpdatedTimestamp: 150,
                ...defaultDeviceAdditionalParams,
            },
        ];
        const result = filterOutOldDuplicatesByName(devices);
        expect(result).toHaveLength(2);
        expect(result).toEqual([
            {
                id: '2',
                name: 'DeviceA',
                lastUpdatedTimestamp: 200,
                ...defaultDeviceAdditionalParams,
            },
            {
                id: '3',
                name: 'DeviceB',
                lastUpdatedTimestamp: 150,
                ...defaultDeviceAdditionalParams,
            },
        ]);
    });

    it('handles multiple sets of duplicates', () => {
        const devices: BluetoothDeviceCommon[] = [
            {
                id: '1',
                name: 'DeviceA',
                lastUpdatedTimestamp: 100,
                ...defaultDeviceAdditionalParams,
            },
            {
                id: '2',
                name: 'DeviceA',
                lastUpdatedTimestamp: 200,
                ...defaultDeviceAdditionalParams,
            },
            {
                id: '3',
                name: 'DeviceB',
                lastUpdatedTimestamp: 150,
                ...defaultDeviceAdditionalParams,
            },
            {
                id: '4',
                name: 'DeviceB',
                lastUpdatedTimestamp: 250,
                ...defaultDeviceAdditionalParams,
            },
            {
                id: '5',
                name: 'DeviceC',
                lastUpdatedTimestamp: 300,
                ...defaultDeviceAdditionalParams,
            },
        ];
        const result = filterOutOldDuplicatesByName(devices);
        expect(result).toHaveLength(3);
        expect(result).toEqual([
            {
                id: '2',
                name: 'DeviceA',
                lastUpdatedTimestamp: 200,
                ...defaultDeviceAdditionalParams,
            },
            {
                id: '4',
                name: 'DeviceB',
                lastUpdatedTimestamp: 250,
                ...defaultDeviceAdditionalParams,
            },
            {
                id: '5',
                name: 'DeviceC',
                lastUpdatedTimestamp: 300,
                ...defaultDeviceAdditionalParams,
            },
        ]);
    });

    it('returns empty array if input is empty', () => {
        const devices: BluetoothDeviceCommon[] = [];
        const result = filterOutOldDuplicatesByName(devices);
        expect(result).toEqual([]);
    });

    it('keeps the latest device when timestamps are equal (prefers last in array)', () => {
        const devices: BluetoothDeviceCommon[] = [
            {
                id: '1',
                name: 'DeviceA',
                lastUpdatedTimestamp: 100,
                ...defaultDeviceAdditionalParams,
            },
            {
                id: '2',
                name: 'DeviceA',
                lastUpdatedTimestamp: 100,
                ...defaultDeviceAdditionalParams,
            },
        ];
        const result = filterOutOldDuplicatesByName(devices);
        expect(result).toEqual([
            {
                id: '2',
                name: 'DeviceA',
                lastUpdatedTimestamp: 100,
                ...defaultDeviceAdditionalParams,
            },
        ]);
    });
});
