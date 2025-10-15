import { asBluetoothDeviceId } from '@trezor/connect';
import * as envUtils from '@trezor/env-utils';

import { DesktopBluetoothDevice } from './DesktopBluetoothDevice';
import { createMockedBluetoothDevice } from './__tests__/createMockedBluetoothDevice';
import { filterOutNonResponsiveDevices } from './filterOutNonResponsiveDevices';

describe(filterOutNonResponsiveDevices.name, () => {
    beforeAll(() => {
        jest.spyOn(Date, 'now').mockReturnValue(8_000);
        jest.spyOn(envUtils, 'isLinux').mockReturnValue(false);
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    it('keeps devices that are in pairing mode regardless of lastUpdatedTimestamp', () => {
        const devices: DesktopBluetoothDevice[] = [
            createMockedBluetoothDevice({
                id: asBluetoothDeviceId('1'),
                name: 'DeviceA',
                lastUpdatedTimestamp: 4_000,
                connectionStatus: { type: 'pairing' },
            }),
            createMockedBluetoothDevice({
                id: asBluetoothDeviceId('2'),
                name: 'DeviceA',
                lastUpdatedTimestamp: 4_000,
                connectionStatus: { type: 'pairing' },
            }),
        ];

        const result = filterOutNonResponsiveDevices(devices);
        expect(result).toHaveLength(2);
    });

    it('filters non responsive devices', () => {
        const devices: DesktopBluetoothDevice[] = [
            createMockedBluetoothDevice({
                id: asBluetoothDeviceId('1'),
                name: 'DeviceA',
                lastUpdatedTimestamp: 4_000,
            }),
            createMockedBluetoothDevice({
                id: asBluetoothDeviceId('2'),
                name: 'DeviceA',
                lastUpdatedTimestamp: 4_000,
            }),
            createMockedBluetoothDevice({
                id: asBluetoothDeviceId('3'),
                name: 'DeviceA',
                lastUpdatedTimestamp: 9_000,
            }),
        ];

        const result = filterOutNonResponsiveDevices(devices);
        expect(result).toHaveLength(1);
    });

    it('keeps responsive devices', () => {
        const devices: DesktopBluetoothDevice[] = [
            createMockedBluetoothDevice({
                id: asBluetoothDeviceId('1'),
                name: 'DeviceA',
                lastUpdatedTimestamp: 7_500,
            }),
            createMockedBluetoothDevice({
                id: asBluetoothDeviceId('2'),
                name: 'DeviceA',
                lastUpdatedTimestamp: 7_000,
            }),
        ];

        const result = filterOutNonResponsiveDevices(devices);
        expect(result).toHaveLength(2);
    });

    it('progressively increases the unresponsive device timeout', () => {
        const weakSignalDevices: DesktopBluetoothDevice[] = [
            createMockedBluetoothDevice({
                id: asBluetoothDeviceId('1'),
                name: 'DeviceA',
                lastUpdatedTimestamp: 6_000,
                rssi: -90,
            }),
            createMockedBluetoothDevice({
                id: asBluetoothDeviceId('2'),
                name: 'DeviceB',
                lastUpdatedTimestamp: 5_000,
                rssi: -100,
            }),
            createMockedBluetoothDevice({
                id: asBluetoothDeviceId('3'),
                name: 'DeviceC',
                lastUpdatedTimestamp: 1_000,
            }),
        ];

        const result = filterOutNonResponsiveDevices(weakSignalDevices);
        expect(result).toHaveLength(2);
    });
});
