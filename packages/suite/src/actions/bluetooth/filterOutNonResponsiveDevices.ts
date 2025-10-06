import type { BluetoothDeviceCommon } from '@suite-common/bluetooth/src/types';
import { isLinux } from '@trezor/env-utils';

export const NEARBY_DEVICES_LAST_UPDATED_LIMIT = 3_000;
export const NEARBY_DEVICES_LAST_UPDATED_LIMIT_LINUX = 5_000;

/**
 * Filters out devices that have not been responsive for a certain period of time.
 * Linux (specifically T2 linux distro for Mac) needs more than 3 secs - tested with 5 sec, due to slow drivers.
 */
export const filterOutNonResponsiveDevices = <T extends BluetoothDeviceCommon>(devices: T[]) => {
    const now = Date.now();
    const limit = isLinux()
        ? NEARBY_DEVICES_LAST_UPDATED_LIMIT_LINUX
        : NEARBY_DEVICES_LAST_UPDATED_LIMIT;

    return devices.filter(d => d.lastUpdatedTimestamp >= now - limit);
};
