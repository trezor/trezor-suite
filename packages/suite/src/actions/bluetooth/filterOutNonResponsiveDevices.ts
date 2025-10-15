import type { DeviceBluetoothConnectionStatusType } from '@suite-common/bluetooth/src/types';
import { isLinux } from '@trezor/env-utils';

import { DesktopBluetoothDevice } from './DesktopBluetoothDevice';

export const NEARBY_DEVICES_LAST_UPDATED_LIMIT = 3_000;
export const NEARBY_DEVICES_LAST_UPDATED_LIMIT_LINUX = 5_000;

const NEARBY_DEVICE_WEAK_SIGNAL_LIMIT = -80; // dBm

const NEARBY_DEVICE_INCREASE_PER = 10; // dBm
const NEARBY_DEVICE_INCREASE = 1_000; // ms

const CONNECTION_STATUSES_TO_KEEP: DeviceBluetoothConnectionStatusType[] = [
    'connecting',
    'pairing',
] as const;

/**
 * Filters out devices that have not been responsive for a certain period of time.
 * Linux (specifically T2 linux distro for Mac) needs more than 3 secs - tested with 5 sec, due to slow drivers.
 *
 * Devices in 'pairing' state are kept regardless of last updated timestamp, as they are actively being paired.
 */
export const filterOutNonResponsiveDevices = (devices: DesktopBluetoothDevice[]) => {
    const now = Date.now();
    const baseLimit = isLinux()
        ? NEARBY_DEVICES_LAST_UPDATED_LIMIT_LINUX
        : NEARBY_DEVICES_LAST_UPDATED_LIMIT;

    return devices.filter(device => {
        let limit = baseLimit;

        if (device.rssi && device.rssi <= NEARBY_DEVICE_WEAK_SIGNAL_LIMIT) {
            // for each additional 10 dBm below the weak signal limit, increase the limit by 2 seconds
            // e.g. -90 dBm => 4 seconds increase, -100 dBm => 6 seconds increase, ...
            limit +=
                Math.floor(
                    (NEARBY_DEVICE_WEAK_SIGNAL_LIMIT - device.rssi) / NEARBY_DEVICE_INCREASE_PER,
                ) * NEARBY_DEVICE_INCREASE;
        }

        return (
            device.lastUpdatedTimestamp >= now - limit ||
            CONNECTION_STATUSES_TO_KEEP.includes(device.connectionStatus.type)
        );
    });
};
