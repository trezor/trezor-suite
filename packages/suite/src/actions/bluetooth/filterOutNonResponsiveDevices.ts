import type { DeviceBluetoothConnectionStatusType } from '@suite-common/bluetooth/src/types';
import { isLinux } from '@trezor/env-utils';

import { type DesktopBluetoothDevice } from './DesktopBluetoothDevice';

export const NEARBY_DEVICES_LAST_UPDATED_LIMIT = 3_000;
export const NEARBY_DEVICES_LAST_UPDATED_LIMIT_LINUX = 5_000;

const NEARBY_DEVICE_WEAK_SIGNAL_LIMIT = -80; // dBm

const NEARBY_DEVICE_DECREASE_PER = 10; // dBm
const NEARBY_DEVICE_DECREASE = -1_000; // ms

const CONNECTION_STATUSES_TO_KEEP: DeviceBluetoothConnectionStatusType[] = [
    'connecting',
    'pairing',
    'connected', // this is relevant for devices manually paired via OS Bluetooth settings, instead of Suite
] as const;

/**
 * For each additional 10 dBm below the weak signal limit, increase the limit by 2 seconds
 * e.g. -90 dBm => 2 seconds increase, -100 dBm => 4 seconds increase, ...
 */
export const getLastUpdatedLimitForDevice = (rssi?: number) => {
    const baseLimit = isLinux()
        ? NEARBY_DEVICES_LAST_UPDATED_LIMIT_LINUX
        : NEARBY_DEVICES_LAST_UPDATED_LIMIT;

    if (rssi === undefined) return baseLimit;

    const limit =
        baseLimit +
        Math.floor((rssi - NEARBY_DEVICE_WEAK_SIGNAL_LIMIT) / NEARBY_DEVICE_DECREASE_PER) *
            NEARBY_DEVICE_DECREASE;

    // if above NEARBY_DEVICE_WEAK_SIGNAL_LIMIT, return always base limit
    return Math.max(limit, baseLimit);
};

/**
 * Filters out devices that have not been responsive for a certain period of time.
 * Linux (specifically T2 linux distro for Mac) needs more than 3 secs - tested with 5 sec, due to slow drivers.
 *
 * Devices in 'connecting' and 'pairing' states are kept regardless of last updated timestamp, as they are actively being connected or paired.
 */
export const filterOutNonResponsiveDevices = (devices: DesktopBluetoothDevice[]) => {
    const now = Date.now();

    return devices.filter(
        device =>
            device.lastUpdatedTimestamp >= now - getLastUpdatedLimitForDevice(device.rssi) ||
            CONNECTION_STATUSES_TO_KEEP.includes(device.connectionStatus.type),
    );
};
