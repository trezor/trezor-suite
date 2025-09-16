import { filterOutOldDuplicatesByName } from '../src/filterOutOldDuplicatesByName';
import { createBluetoothDevice } from '../src/support/mocks';
import { BluetoothDeviceCommon } from '../src/types';

describe(filterOutOldDuplicatesByName.name, () => {
    it('returns all devices if names are unique', () => {
        const devices: BluetoothDeviceCommon[] = [
            createBluetoothDevice({ id: '1', name: 'DeviceA', lastUpdatedTimestamp: 100 }),
            createBluetoothDevice({ id: '2', name: 'DeviceB', lastUpdatedTimestamp: 200 }),
            createBluetoothDevice({ id: '3', name: 'DeviceC', lastUpdatedTimestamp: 300 }),
        ];
        const result = filterOutOldDuplicatesByName(devices);
        expect(result).toHaveLength(3);
        expect(result).toEqual(devices);
    });

    it('keeps only the latest device for duplicate names', () => {
        const devices: BluetoothDeviceCommon[] = [
            createBluetoothDevice({ id: '1', name: 'DeviceA', lastUpdatedTimestamp: 100 }),
            createBluetoothDevice({ id: '2', name: 'DeviceA', lastUpdatedTimestamp: 200 }),
            createBluetoothDevice({ id: '3', name: 'DeviceB', lastUpdatedTimestamp: 150 }),
        ];
        const result = filterOutOldDuplicatesByName(devices);
        expect(result).toHaveLength(2);
        expect(result).toEqual([
            createBluetoothDevice({ id: '2', name: 'DeviceA', lastUpdatedTimestamp: 200 }),
            createBluetoothDevice({ id: '3', name: 'DeviceB', lastUpdatedTimestamp: 150 }),
        ]);
    });

    it('handles multiple sets of duplicates', () => {
        const devices: BluetoothDeviceCommon[] = [
            createBluetoothDevice({ id: '1', name: 'DeviceA', lastUpdatedTimestamp: 100 }),
            createBluetoothDevice({ id: '2', name: 'DeviceA', lastUpdatedTimestamp: 200 }),
            createBluetoothDevice({ id: '3', name: 'DeviceB', lastUpdatedTimestamp: 150 }),
            createBluetoothDevice({ id: '4', name: 'DeviceB', lastUpdatedTimestamp: 250 }),
            createBluetoothDevice({ id: '5', name: 'DeviceC', lastUpdatedTimestamp: 300 }),
        ];
        const result = filterOutOldDuplicatesByName(devices);
        expect(result).toHaveLength(3);
        expect(result).toEqual([
            createBluetoothDevice({ id: '2', name: 'DeviceA', lastUpdatedTimestamp: 200 }),
            createBluetoothDevice({ id: '4', name: 'DeviceB', lastUpdatedTimestamp: 250 }),
            createBluetoothDevice({ id: '5', name: 'DeviceC', lastUpdatedTimestamp: 300 }),
        ]);
    });

    it('returns empty array if input is empty', () => {
        const devices: BluetoothDeviceCommon[] = [];
        const result = filterOutOldDuplicatesByName(devices);
        expect(result).toEqual([]);
    });

    it('keeps the latest device when timestamps are equal (prefers last in array)', () => {
        const devices: BluetoothDeviceCommon[] = [
            createBluetoothDevice({ id: '1', name: 'DeviceA', lastUpdatedTimestamp: 100 }),
            createBluetoothDevice({ id: '2', name: 'DeviceA', lastUpdatedTimestamp: 100 }),
        ];
        const result = filterOutOldDuplicatesByName(devices);
        expect(result).toEqual([
            createBluetoothDevice({ id: '2', name: 'DeviceA', lastUpdatedTimestamp: 100 }),
        ]);
    });
});
