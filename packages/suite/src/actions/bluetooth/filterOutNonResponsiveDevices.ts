import type {
    BluetoothDeviceCommon,
    DeviceBluetoothConnectionStatusType,
} from '@suite-common/bluetooth/src/types';
import { isLinux } from '@trezor/env-utils';

export const NEARBY_DEVICES_LAST_UPDATED_LIMIT = 3_000;
export const NEARBY_DEVICES_LAST_UPDATED_LIMIT_LINUX = 5_000;

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
export const filterOutNonResponsiveDevices = <T extends BluetoothDeviceCommon>(devices: T[]) => {
    const now = Date.now();
    const limit = isLinux()
        ? NEARBY_DEVICES_LAST_UPDATED_LIMIT_LINUX
        : NEARBY_DEVICES_LAST_UPDATED_LIMIT;

    return devices.filter(
        device =>
            device.lastUpdatedTimestamp >= now - limit ||
            CONNECTION_STATUSES_TO_KEEP.includes(device.connectionStatus.type),
    );
};
