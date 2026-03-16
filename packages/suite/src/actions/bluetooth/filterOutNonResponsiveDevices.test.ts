import { asBluetoothDeviceId } from '@trezor/connect';
import * as envUtils from '@trezor/env-utils';

import { type DesktopBluetoothDevice } from './DesktopBluetoothDevice';
import { createMockedBluetoothDevice } from './__tests__/createMockedBluetoothDevice';
import {
    filterOutNonResponsiveDevices,
    getLastUpdatedLimitForDevice,
} from './filterOutNonResponsiveDevices';

const NOW = 8_000;

describe(filterOutNonResponsiveDevices.name, () => {
    beforeAll(() => {
        jest.spyOn(Date, 'now').mockReturnValue(NOW);
        jest.spyOn(envUtils, 'isLinux').mockReturnValue(false);
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    it('keeps devices that are in specified modes regardless of lastUpdatedTimestamp', () => {
        const devices: DesktopBluetoothDevice[] = [
            createMockedBluetoothDevice({
                id: asBluetoothDeviceId('1'),
                name: 'DeviceA',
                lastUpdatedTimestamp: NOW - 4_000,
                connectionStatus: { type: 'pairing' },
            }),
            createMockedBluetoothDevice({
                id: asBluetoothDeviceId('2'),
                name: 'DeviceB',
                lastUpdatedTimestamp: NOW - 4_000,
                connectionStatus: { type: 'connecting' },
            }),
            createMockedBluetoothDevice({
                id: asBluetoothDeviceId('3'),
                name: 'DeviceC',
                lastUpdatedTimestamp: NOW - 4_000,
                connectionStatus: { type: 'connected' },
            }),
        ];

        const result = filterOutNonResponsiveDevices(devices);
        expect(result).toHaveLength(3);
    });

    it('filters non responsive devices', () => {
        const devices: DesktopBluetoothDevice[] = [
            createMockedBluetoothDevice({
                id: asBluetoothDeviceId('1'),
                connectionStatus: { type: 'paired' },
                name: 'DeviceA',
                lastUpdatedTimestamp: NOW - 4_000,
            }),
            createMockedBluetoothDevice({
                id: asBluetoothDeviceId('2'),
                connectionStatus: { type: 'paired' },
                name: 'DeviceA',
                lastUpdatedTimestamp: NOW - 4_000,
            }),
            createMockedBluetoothDevice({
                id: asBluetoothDeviceId('3'),
                connectionStatus: { type: 'paired' },
                name: 'DeviceA',
                lastUpdatedTimestamp: NOW + 1_000,
            }),
        ];

        const result = filterOutNonResponsiveDevices(devices);
        expect(result).toHaveLength(1);
    });

    it('keeps responsive devices', () => {
        const devices: DesktopBluetoothDevice[] = [
            createMockedBluetoothDevice({
                id: asBluetoothDeviceId('1'),
                connectionStatus: { type: 'paired' },
                name: 'DeviceA',
                lastUpdatedTimestamp: NOW - 500,
            }),
            createMockedBluetoothDevice({
                id: asBluetoothDeviceId('2'),
                connectionStatus: { type: 'paired' },
                name: 'DeviceA',
                lastUpdatedTimestamp: NOW - 1_000,
            }),
        ];

        const result = filterOutNonResponsiveDevices(devices);
        expect(result).toHaveLength(2);
    });

    it('progressively increases the unresponsive device timeout', () => {
        const weakSignalDevices: DesktopBluetoothDevice[] = [
            createMockedBluetoothDevice({
                id: asBluetoothDeviceId('1'),
                connectionStatus: { type: 'paired' },
                name: 'DeviceA',
                lastUpdatedTimestamp: NOW - 2_000,
                rssi: -90,
            }),
            createMockedBluetoothDevice({
                id: asBluetoothDeviceId('2'),
                connectionStatus: { type: 'paired' },
                name: 'DeviceB',
                lastUpdatedTimestamp: NOW - 5_000,
                rssi: -100,
            }),
            createMockedBluetoothDevice({
                id: asBluetoothDeviceId('2'),
                connectionStatus: { type: 'paired' },
                name: 'DeviceB',
                lastUpdatedTimestamp: NOW - 5_001,
                rssi: -100,
            }),
            createMockedBluetoothDevice({
                id: asBluetoothDeviceId('3'),
                connectionStatus: { type: 'paired' },
                name: 'DeviceC',
                lastUpdatedTimestamp: NOW - 7000,
            }),
        ];

        const result = filterOutNonResponsiveDevices(weakSignalDevices);
        expect(result).toHaveLength(2);
    });
});

describe(getLastUpdatedLimitForDevice.name, () => {
    afterAll(() => {
        jest.restoreAllMocks();
    });
    it('calculates limit as per rssi for platforms other than linux', () => {
        jest.spyOn(envUtils, 'isLinux').mockReturnValue(false);
        expect(getLastUpdatedLimitForDevice(undefined)).toBe(3_000);
        expect(getLastUpdatedLimitForDevice(-35)).toBe(3_000);
        expect(getLastUpdatedLimitForDevice(-70)).toBe(3_000);
        expect(getLastUpdatedLimitForDevice(-80)).toBe(3_000);
        expect(getLastUpdatedLimitForDevice(-81)).toBe(4_000);
        expect(getLastUpdatedLimitForDevice(-89)).toBe(4_000);
        expect(getLastUpdatedLimitForDevice(-91)).toBe(5_000);
        expect(getLastUpdatedLimitForDevice(-111)).toBe(7_000);
    });

    it('calculates limit as per rssi for linux', () => {
        jest.spyOn(envUtils, 'isLinux').mockReturnValue(true);
        expect(getLastUpdatedLimitForDevice(undefined)).toBe(5_000);
        expect(getLastUpdatedLimitForDevice(-35)).toBe(5_000);
        expect(getLastUpdatedLimitForDevice(-70)).toBe(5_000);
        expect(getLastUpdatedLimitForDevice(-80)).toBe(5_000);
        expect(getLastUpdatedLimitForDevice(-81)).toBe(6_000);
        expect(getLastUpdatedLimitForDevice(-89)).toBe(6_000);
        expect(getLastUpdatedLimitForDevice(-91)).toBe(7_000);
        expect(getLastUpdatedLimitForDevice(-111)).toBe(9_000);
    });
});
