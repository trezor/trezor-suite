import { asBluetoothDeviceId } from '@trezor/connect';
import { isLinux } from '@trezor/env-utils';

jest.mock('@trezor/env-utils', () => ({
    ...jest.requireActual('@trezor/env-utils'),
    isLinux: jest.fn(),
}));

import { type DesktopBluetoothDevice } from './DesktopBluetoothDevice';
import {
    filterOutNonResponsiveDevices,
    getLastUpdatedLimitForDevice,
} from './filterOutNonResponsiveDevices';
import { mockDesktopBluetoothDevice } from '../../../mocks/mockDesktopBluetoothDevice';

const NOW = 8_000;

describe(filterOutNonResponsiveDevices.name, () => {
    beforeAll(() => {
        jest.spyOn(Date, 'now').mockReturnValue(NOW);
        (isLinux as jest.Mock).mockReturnValue(false);
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    it('keeps devices that are in specified modes regardless of lastUpdatedTimestamp', () => {
        const devices: DesktopBluetoothDevice[] = [
            mockDesktopBluetoothDevice({
                id: asBluetoothDeviceId('1'),
                name: 'DeviceA',
                lastUpdatedTimestamp: NOW - 4_000,
                connectionStatus: { type: 'pairing' },
            }),
            mockDesktopBluetoothDevice({
                id: asBluetoothDeviceId('2'),
                name: 'DeviceB',
                lastUpdatedTimestamp: NOW - 4_000,
                connectionStatus: { type: 'connecting' },
            }),
            mockDesktopBluetoothDevice({
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
            mockDesktopBluetoothDevice({
                id: asBluetoothDeviceId('1'),
                connectionStatus: { type: 'paired' },
                name: 'DeviceA',
                lastUpdatedTimestamp: NOW - 4_000,
            }),
            mockDesktopBluetoothDevice({
                id: asBluetoothDeviceId('2'),
                connectionStatus: { type: 'paired' },
                name: 'DeviceA',
                lastUpdatedTimestamp: NOW - 4_000,
            }),
            mockDesktopBluetoothDevice({
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
            mockDesktopBluetoothDevice({
                id: asBluetoothDeviceId('1'),
                connectionStatus: { type: 'paired' },
                name: 'DeviceA',
                lastUpdatedTimestamp: NOW - 500,
            }),
            mockDesktopBluetoothDevice({
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
            mockDesktopBluetoothDevice({
                id: asBluetoothDeviceId('1'),
                connectionStatus: { type: 'paired' },
                name: 'DeviceA',
                lastUpdatedTimestamp: NOW - 2_000,
                rssi: -90,
            }),
            mockDesktopBluetoothDevice({
                id: asBluetoothDeviceId('2'),
                connectionStatus: { type: 'paired' },
                name: 'DeviceB',
                lastUpdatedTimestamp: NOW - 5_000,
                rssi: -100,
            }),
            mockDesktopBluetoothDevice({
                id: asBluetoothDeviceId('2'),
                connectionStatus: { type: 'paired' },
                name: 'DeviceB',
                lastUpdatedTimestamp: NOW - 5_001,
                rssi: -100,
            }),
            mockDesktopBluetoothDevice({
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
        (isLinux as jest.Mock).mockReturnValue(false);
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
        (isLinux as jest.Mock).mockReturnValue(true);
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
