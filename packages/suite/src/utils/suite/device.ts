import colors from '@trezor/components/lib/config/colors'; // TODO: fix this import, jest fails on svg parsing
import { WrappedComponentProps } from 'react-intl';
import messages from '@suite/support/messages';
import { Device } from 'trezor-connect';
import { TrezorDevice, AcquiredDevice } from '@suite-types';

export const getStatus = (device: TrezorDevice): string => {
    if (device.type === 'acquired') {
        if (!device.connected) {
            return 'disconnected';
        }
        if (!device.available) {
            return 'unavailable';
        }
        if (device.mode === 'bootloader') {
            return 'bootloader';
        }
        if (device.mode === 'initialize') {
            return 'initialize';
        }
        if (device.mode === 'seedless') {
            return 'seedless';
        }
        if (device.firmware === 'required') {
            return 'firmware-required';
        }
        if (device.status === 'occupied') {
            return 'used-in-other-window';
        }
        if (device.status === 'used') {
            return 'was-used-in-other-window';
        }
        if (device.firmware === 'outdated') {
            return 'firmware-recommended';
        }
        return 'connected';
    }

    if (device.type === 'unacquired') {
        return 'unacquired';
    }
    if (device.type === 'unreadable') {
        return 'unreadable';
    }
    return 'unknown';
};

export const getStatusName = (
    deviceStatus: string,
    intl: WrappedComponentProps['intl'],
): string => {
    switch (deviceStatus) {
        case 'connected':
            return intl.formatMessage(messages.TR_CONNECTED);
        case 'disconnected':
            return intl.formatMessage(messages.TR_DISCONNECTED);
        case 'bootloader':
            return intl.formatMessage(messages.TR_CONNECTED_BOOTLOADER);
        case 'initialize':
            return intl.formatMessage(messages.TR_CONNECTED_NOT_INITIALIZED);
        case 'seedless':
            return intl.formatMessage(messages.TR_CONNECTED_SEEDLESS);
        case 'firmware-required':
            return intl.formatMessage(messages.TR_CONNECTED_UPDATE_REQUIRED);
        case 'firmware-recommended':
            return intl.formatMessage(messages.TR_CONNECTED_UPDATE_RECOMMENDED);
        case 'used-in-other-window':
            return intl.formatMessage(messages.TR_USED_IN_ANOTHER_WINDOW);
        case 'was-used-in-other-window':
            return intl.formatMessage(messages.TR_WAS_USED_IN_ANOTHER_WINDOW);
        case 'unacquired':
            return intl.formatMessage(messages.TR_USED_IN_ANOTHER_WINDOW);
        case 'unavailable':
            return intl.formatMessage(messages.TR_UNAVAILABLE);
        case 'unreadable':
            return intl.formatMessage(messages.TR_UNREADABLE);
        default:
            return intl.formatMessage(messages.TR_STATUS_UNKNOWN);
    }
};

export const getStatusColor = (deviceStatus: string): string => {
    switch (deviceStatus) {
        case 'connected':
            return colors.GREEN_PRIMARY;
        case 'disconnected':
            return colors.ERROR_PRIMARY;
        case 'bootloader':
        case 'initialize':
        case 'seedless':
        case 'firmware-recommended':
        case 'used-in-other-window':
        case 'was-used-in-other-window':
        case 'unacquired':
            return colors.WARNING_PRIMARY;
        case 'firmware-required':
        case 'unavailable':
        case 'unreadable':
            return colors.ERROR_PRIMARY;
        default:
            return colors.TEXT_PRIMARY;
    }
};

export const isDeviceRemembered = (device?: TrezorDevice): boolean =>
    device ? !!device.remember : false;

export const isDeviceAccessible = (device?: TrezorDevice) => {
    if (!device || !device.features) return false;
    return device.mode === 'normal' && device.firmware !== 'required';
};

export const isSelectedInstance = (selected?: TrezorDevice, device?: TrezorDevice) =>
    !!(
        selected &&
        device &&
        selected.features &&
        device.features &&
        device.features.device_id &&
        selected.features.device_id === device.features.device_id &&
        selected.instance === device.instance
    );

export const isSelectedDevice = (selected?: TrezorDevice, device?: TrezorDevice) => {
    if (!selected || !device) return false;
    if (!selected.features && !device.features) return selected.path === device.path;
    return !!(
        selected.features &&
        selected.features.device_id &&
        device.features &&
        device.features.device_id &&
        selected.features.device_id === device.features.device_id
    );
};

export const getVersion = (device: TrezorDevice) => {
    const { features } = device;
    return features && features.major_version > 1 ? 'T' : 'One';
};

export const getFwVersion = (device: AcquiredDevice) => {
    const { features } = device;
    return `${features.major_version}.${features.minor_version}.${features.patch_version}`;
};

/**
 * Generate new instance number
 * @param {TrezorDevice[]} devices
 * @param {AcquiredDevice} device
 * @returns number
 */
export const getNewInstanceNumber = (devices: TrezorDevice[], device: TrezorDevice | Device) => {
    if (!device.features) return undefined;
    // find all instances with device "device_id"
    // and sort them by instance number
    const affectedDevices = devices
        .filter(d => d.features && d.features.device_id === device.features.device_id)
        .sort((a, b) => {
            if (!a.instance) {
                return -1;
            }
            return !b.instance || a.instance > b.instance ? 1 : -1;
        });

    // calculate new instance number
    const instance = affectedDevices.reduce(
        (inst, dev) => (dev.instance ? dev.instance + 1 : inst + 1),
        0,
    );
    return instance > 0 ? instance : undefined;
};

/**
 * Find exact instance index
 * @param {TrezorDevice[]} draft
 * @param {AcquiredDevice} device
 */
export const findInstanceIndex = (draft: TrezorDevice[], device: AcquiredDevice) =>
    draft.findIndex(
        d =>
            d.features &&
            d.features.device_id &&
            d.features.device_id === device.features.device_id &&
            d.instance === device.instance,
    );

/**
 * Utility for retrieving fresh data from the "devices" reducer
 * It's used for keep "suite" reducer synchronized via `suiteMiddleware > suiteActions.observeSelectedDevice`
 * @param {(TrezorDevice)} device
 * @param {TrezorDevice[]} devices
 * @returns {TrezorDevice | undefined }
 */
export const getSelectedDevice = (
    device: TrezorDevice,
    devices: TrezorDevice[],
): TrezorDevice | undefined => {
    // selected device is not acquired
    if (!device.features) return devices.find(d => d.path === device.path);
    const { path, instance, features } = device;

    return devices.find(d => {
        if ((!d.features || d.mode === 'bootloader') && d.path === path) {
            return true;
        }
        if (d.instance === instance && d.features && d.features.device_id === features.device_id) {
            return true;
        }

        // special case we need to use after wipe device (which changes device_id)
        if (d.instance === instance && d.path.length > 0 && d.path === device.path) {
            return true;
        }

        return false;
    });
};

/**
 * Used by suiteActions
 * Sort devices by "ts" (timestamp) field
 * @param {TrezorDevice[]} devices
 * @returns {TrezorDevice[]}
 */
export const sortByTimestamp = (devices: TrezorDevice[]): TrezorDevice[] => {
    // Node.js v11+ changed sort algo https://github.com/nodejs/node/pull/22754#issuecomment-423452575
    // In unit tests some devices have undefined ts
    return devices.sort((a, b) => {
        if (!a.ts && !b.ts) return 0; // both devices has undefined ts, keep their pos
        if (!b.ts && a.ts) return -1;
        if (!a.ts && b.ts) return 1;
        return b.ts - a.ts;
    });
};

export const sortByPriority = (a: TrezorDevice, b: TrezorDevice) => {
    // sort by priority:
    // 1. unacquired
    // 2. unexpected mode
    // 3. outdated firmware
    // 5. timestamp

    if (!b.features && !a.features) return 0;
    if (!b.features && a.features) return 1;
    if (!b.features || !a.features) return -1;

    if (a.mode !== 'normal' && b.mode !== 'normal') return 0;
    if (b.mode !== 'normal') return 1;
    if (a.mode !== 'normal') return -1;

    if (a.firmware !== 'valid' && b.firmware !== 'valid') return 0;
    if (b.firmware !== 'valid') return 1;
    if (a.firmware !== 'valid') return -1;

    if (!b.ts && !a.ts) return 0;
    if (!b.ts && a.ts) return -1;
    if (!b.ts || !a.ts) return 1;
    return b.ts - a.ts;
};

/**
 * Returns all device instances sorted by `instance` field
 * @param {TrezorDevice | undefined} device
 * @param {TrezorDevice[]} devices
 * @param {boolean} exclude - excludes `device` from results
 * @returns {TrezorDevice[]}
 */
export const getDeviceInstances = (
    device: TrezorDevice,
    devices: TrezorDevice[],
    exclude = false,
): AcquiredDevice[] => {
    if (!device || !device.features || !device.features.device_id) return [];
    return devices
        .filter(
            d =>
                d.features &&
                d.features.device_id === device.features.device_id &&
                (!exclude || (exclude && d.instance !== device.instance)),
        )
        .sort((a, b) => {
            if (!a.instance) return -1;
            if (!b.instance) return 1;
            return a.instance > b.instance ? 1 : -1;
        }) as AcquiredDevice[];
};

/**
 * Returns first available instance for each device sorted by priority
 * @param {TrezorDevice[]} devices
 * @returns {TrezorDevice[]}
 */
export const getFirstDeviceInstance = (devices: TrezorDevice[]) => {
    // filter device instances
    return devices
        .reduce((result, dev) => {
            // unacquired devices always return empty array
            const instances = getDeviceInstances(dev, devices);
            if (instances.length < 1) return result.concat(dev);
            // `device_id` already exists in result
            const alreadyExists = result.find(
                r => r.features && dev.features && r.features.device_id === dev.features.device_id,
            );
            if (alreadyExists) return result;
            // base (np passphrase) or first passphrase instance
            return result.concat(instances[0]);
        }, [] as TrezorDevice[])
        .sort(sortByPriority);
};
