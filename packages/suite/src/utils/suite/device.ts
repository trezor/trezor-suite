import { Device, UnavailableCapability } from '@trezor/connect';
import { TrezorDevice, AcquiredDevice } from '@suite-types';
import { DeviceModel, getDeviceModel } from '@trezor/device-utils';
import * as URLS from '@trezor/urls';

/**
 * Used in Welcome step in Onboarding
 * Status 'ok' or 'initialized' is what we expect, 'bootloader', 'seedless' and 'unreadable' are no go
 *
 * @param {(TrezorDevice | undefined)} device
 * @returns
 */
export const getConnectedDeviceStatus = (device: TrezorDevice | undefined) => {
    if (!device) return null;

    const isInBlWithFwPresent =
        device.mode === 'bootloader' && device.features?.firmware_present === true;

    if (isInBlWithFwPresent) return 'bootloader';
    if (device.features?.initialized) return 'initialized';
    if (device.features?.no_backup) return 'seedless';
    if (device.type === 'unreadable') return 'unreadable';
    return 'ok';
};

export const getStatus = (device: TrezorDevice) => {
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

export const deviceNeedsAttention = (deviceStatus: ReturnType<typeof getStatus>) => {
    switch (deviceStatus) {
        // case 'firmware-recommended':
        // case 'unavailable': // this case is already solved in Account view @wallet-components/AccountMode/DeviceUnavailable
        case 'bootloader':
        case 'initialize':
        case 'seedless':
        case 'used-in-other-window':
        case 'was-used-in-other-window':
        case 'unacquired':
        case 'firmware-required':
        case 'unreadable':
            return true;
        default:
            return false;
    }
};

export const getDeviceNeedsAttentionMessage = (deviceStatus: ReturnType<typeof getStatus>) => {
    switch (deviceStatus) {
        // case 'firmware-recommended':
        case 'bootloader':
            return 'TR_NEEDS_ATTENTION_BOOTLOADER';
        case 'initialize':
            return 'TR_NEEDS_ATTENTION_INITIALIZE';
        case 'seedless':
            return 'TR_NEEDS_ATTENTION_SEEDLESS';
        case 'used-in-other-window':
            return 'TR_NEEDS_ATTENTION_USED_IN_OTHER_WINDOW';
        case 'was-used-in-other-window':
            return 'TR_NEEDS_ATTENTION_WAS_USED_IN_OTHER_WINDOW';
        case 'unacquired':
            return 'TR_NEEDS_ATTENTION_UNACQUIRED';
        case 'firmware-required':
            return 'TR_NEEDS_ATTENTION_FIRMWARE_REQUIRED';
        case 'unavailable':
            return 'TR_NEEDS_ATTENTION_UNAVAILABLE';
        case 'unreadable':
            return 'TR_NEEDS_ATTENTION_UNREADABLE';
        default:
            return null;
    }
};

export const isDeviceRemembered = (device?: TrezorDevice): boolean => !!device?.remember;

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
        device.id &&
        selected.id === device.id &&
        selected.instance === device.instance
    );

export const isSelectedDevice = (selected?: TrezorDevice | Device, device?: TrezorDevice) => {
    if (!selected || !device) return false;
    if (!selected.id || selected.mode === 'bootloader') return selected.path === device.path;
    return selected.id === device.id;
};

/**
 *  When updating T1, always display changelog of the latest version, even though intermediary firmware is being installed.
 *  When other models are updated, show changelog of version device is updated to.
 *  (TT - in case of initial fw, before updating to newest version device has to be updated to specific version)
 *  @param {TrezorDevice} device
 */
export const getFirmwareRelease = (device: TrezorDevice) => {
    const deviceModel = getDeviceModel(device);

    const firmwareReleaseType = deviceModel === DeviceModel.T1 ? 'latest' : 'release';

    return device.firmwareRelease?.[firmwareReleaseType];
};

export const getFwUpdateVersion = (device: AcquiredDevice) => {
    const firmwareReleaseVersion = getFirmwareRelease(device)?.version;

    return firmwareReleaseVersion?.join('.') || null;
};

export const getCoinUnavailabilityMessage = (reason: UnavailableCapability) => {
    switch (reason) {
        case 'no-capability':
            return 'FW_CAPABILITY_NO_CAPABILITY';
        case 'no-support':
            return 'FW_CAPABILITY_NO_SUPPORT';
        case 'update-required':
            return 'FW_CAPABILITY_UPDATE_REQUIRED';
        case 'trezor-connect-outdated':
            return 'FW_CAPABILITY_CONNECT_OUTDATED';
        // no default
    }
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
        .filter(d => d.features && d.id === device.id)
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

export const getNewWalletNumber = (devices: TrezorDevice[], device: TrezorDevice) => {
    const relevantDevices = devices
        .filter(d => d.features && d.id === device.id && d.walletNumber && !d.useEmptyPassphrase)
        .sort((a, b) =>
            a.walletNumber && b.walletNumber && a.walletNumber < b.walletNumber ? 1 : -1,
        );

    return (relevantDevices[0]?.walletNumber || 0) + 1;
};

/**
 * Find exact instance index
 * @param {TrezorDevice[]} draft
 * @param {AcquiredDevice} device
 */
export const findInstanceIndex = (draft: TrezorDevice[], device: AcquiredDevice) =>
    draft.findIndex(
        d => d.features && d.id && d.id === device.id && d.instance === device.instance,
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
    const { path, instance } = device;

    return devices.find(d => {
        if ((!d.features || d.mode === 'bootloader') && d.path === path) {
            return true;
        }
        if (d.instance === instance && d.features && d.id === device.id) {
            return true;
        }

        // special case we need to use after wipe device (which changes device_id)
        if (d.instance === instance && d.path.length > 0 && d.path === device.path) {
            return true;
        }

        return false;
    });
};

export const getChangelogUrl = (device: TrezorDevice, revision?: string | null) => {
    const deviceModel = getDeviceModel(device);
    const commit = revision || 'master';
    const folder = deviceModel === DeviceModel.T1 ? 'legacy/firmware' : 'core';

    return `https://github.com/trezor/trezor-firmware/blob/${commit}/${folder}/CHANGELOG.md`;
};

export const getCheckBackupUrl = (device?: TrezorDevice) => {
    const deviceModel = getDeviceModel(device);

    if (!deviceModel) {
        return '';
    }

    return URLS[`HELP_CENTER_DRY_RUN_T${deviceModel}_URL`];
};

export const getPackagingUrl = (device?: TrezorDevice) => {
    const deviceModel = getDeviceModel(device);

    if (!deviceModel) {
        return '';
    }

    return URLS[`HELP_CENTER_PACKAGING_T${deviceModel}_URL`];
};

export const getFirmwareDowngradeUrl = (device?: TrezorDevice) => {
    const deviceModel = getDeviceModel(device);

    if (!deviceModel) {
        return '';
    }

    return URLS[`HELP_CENTER_FW_DOWNGRADE_T${deviceModel}_URL`];
};

/**
 * Used by suiteActions
 * Sort devices by "ts" (timestamp) field
 * @param {TrezorDevice[]} devices
 * @returns {TrezorDevice[]}
 */
export const sortByTimestamp = (devices: TrezorDevice[]): TrezorDevice[] =>
    // Node.js v11+ changed sort algo https://github.com/nodejs/node/pull/22754#issuecomment-423452575
    // In unit tests some devices have undefined ts
    devices.sort((a, b) => {
        if (!a.ts && !b.ts) return 0; // both devices has undefined ts, keep their pos
        if (!b.ts && a.ts) return -1;
        if (!a.ts && b.ts) return 1;
        return b.ts - a.ts;
    });

export const sortByPriority = (a: TrezorDevice, b: TrezorDevice) => {
    // sort by priority:
    // 1. unacquired
    // 2. force remembered
    // 3. unexpected mode
    // 4. outdated firmware
    // 5. timestamp

    // 1
    if (!b.features && !a.features) return 0;
    if (!b.features && a.features) return 1;
    if (!b.features || !a.features) return -1;

    // 2
    if (a.forceRemember !== b.forceRemember) {
        if (!a.forceRemember && b.forceRemember) return 1;
        if (a.forceRemember && !b.forceRemember) return -1;
    }

    // 3
    if (a.mode !== 'normal' && b.mode !== 'normal') return 0;
    if (b.mode !== 'normal') return 1;
    if (a.mode !== 'normal') return -1;

    // 4
    if (a.firmware !== 'valid' && b.firmware !== 'valid') return 0;
    if (b.firmware !== 'valid') return 1;
    if (a.firmware !== 'valid') return -1;

    // 5
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
    if (!device || !device.features || !device.id) return [];
    return devices
        .filter(
            d =>
                d.features &&
                d.id === device.id &&
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
export const getFirstDeviceInstance = (devices: TrezorDevice[]) =>
    // filter device instances
    devices
        .reduce((result, dev) => {
            // unacquired devices always return empty array
            const instances = getDeviceInstances(dev, devices);
            if (instances.length < 1) return result.concat(dev);
            // `device_id` already exists in result
            const alreadyExists = result.find(r => r.features && dev.features && r.id === dev.id);
            if (alreadyExists) return result;
            // base (np passphrase) or first passphrase instance
            return result.concat(instances[0]);
        }, [] as TrezorDevice[])
        .sort(sortByPriority);

export const getPhysicalDeviceUniqueIds = (devices: Device[]) =>
    [...new Set(devices.map(d => d.id))].filter(id => id) as string[];

export const getPhysicalDeviceCount = (devices: Device[]) =>
    getPhysicalDeviceUniqueIds(devices).length;

export const parseFirmwareChangelog = (device: TrezorDevice) => {
    const firmwareRelease = getFirmwareRelease(device);

    if (!device.firmwareRelease?.changelog?.length || !firmwareRelease) {
        return null;
    }

    // Default changelog format is a long string where individual changes are separated by "*" symbol.
    const changelog = firmwareRelease.changelog
        .trim()
        .split('*')
        .map(l => l.trim())
        .filter(l => l.length);

    return {
        url: firmwareRelease.url,
        notes: firmwareRelease.notes,
        changelog,
        versionString: firmwareRelease.version.join('.'),
    };
};
