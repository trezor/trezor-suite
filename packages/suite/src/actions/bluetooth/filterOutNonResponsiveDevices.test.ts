import { createBluetoothDevice } from '@suite-common/bluetooth/src/support/mocks';
import { BluetoothDeviceCommon } from '@suite-common/bluetooth/src/types';
import { asBluetoothDeviceId } from '@trezor/connect';
import * as envUtils from '@trezor/env-utils';

import { filterOutNonResponsiveDevices } from './filterOutNonResponsiveDevices';

describe(filterOutNonResponsiveDevices.name, () => {
    beforeAll(() => {
        jest.spyOn(Date, 'now').mockReturnValue(5_000);
        jest.spyOn(envUtils, 'isLinux').mockReturnValue(false);
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    it('keeps devices that are in pairing mode regardless of lastUpdatedTimestamp', () => {
        const devices: BluetoothDeviceCommon[] = [
            createBluetoothDevice({
                id: asBluetoothDeviceId('1'),
                name: 'DeviceA',
                lastUpdatedTimestamp: 1_000,
                connectionStatus: { type: 'pairing' },
            }),
            createBluetoothDevice({
                id: asBluetoothDeviceId('2'),
                name: 'DeviceA',
                lastUpdatedTimestamp: 1_000,
                connectionStatus: { type: 'pairing' },
            }),
        ];

        const result = filterOutNonResponsiveDevices(devices);
        expect(result).toHaveLength(2);
    });

    it('filters non responsive devices', () => {
        const devices: BluetoothDeviceCommon[] = [
            createBluetoothDevice({
                id: asBluetoothDeviceId('1'),
                name: 'DeviceA',
                lastUpdatedTimestamp: 1_000,
            }),
            createBluetoothDevice({
                id: asBluetoothDeviceId('2'),
                name: 'DeviceA',
                lastUpdatedTimestamp: 1_000,
            }),
            createBluetoothDevice({
                id: asBluetoothDeviceId('3'),
                name: 'DeviceA',
                lastUpdatedTimestamp: 5_000,
            }),
        ];

        const result = filterOutNonResponsiveDevices(devices);
        expect(result).toHaveLength(1);
    });

    it('keeps responsive devices', () => {
        const devices: BluetoothDeviceCommon[] = [
            createBluetoothDevice({
                id: asBluetoothDeviceId('1'),
                name: 'DeviceA',
                lastUpdatedTimestamp: 3_500,
            }),
            createBluetoothDevice({
                id: asBluetoothDeviceId('2'),
                name: 'DeviceA',
                lastUpdatedTimestamp: 4_000,
            }),
        ];

        const result = filterOutNonResponsiveDevices(devices);
        expect(result).toHaveLength(2);
    });
});
