import { type AcquiredDevice, type TrezorDevice } from '@suite-common/suite-types';
import {
    DEVICE,
    type Device,
    type DeviceEvent,
    type DeviceMode,
    type KnownDevice,
    type PROTO,
    type UnavailableCapability,
} from '@trezor/connect';
import { DeviceModelInternal, getNarrowedDeviceModelInternal } from '@trezor/device-utils';
import { exhaustive } from '@trezor/type-utils';
import * as URLS from '@trezor/urls';
import { hasProp, isArrayMember } from '@trezor/utils';

export const deviceStatuses = [
    'acquired',
    'unacquired',
    'unreadable',
    'disconnected',
    'unavailable',
    'bootloader',
    'initialize',
    'seedless',
    'firmware-required',
    'used-in-other-window',
    'was-used-in-other-window',
    'firmware-recommended',
    'connected',
    'device-busy',
    'device-rebooting',
    'device-bootloader-locked',
    'device-hard-locked',
    'device-pin-locked',
    'device-thp-locked',
    'firmware-corrupted',
    'unknown',
] as const;
export type DeviceStatus = (typeof deviceStatuses)[number];

export const getStatus = (device: TrezorDevice): DeviceStatus => {
    if (!device.connected) {
        return 'disconnected';
    }
    if (device.status === 'busy') {
        return 'device-busy';
    }
    if (device.status === 'thp-locked') {
        return 'device-thp-locked';
    }
    if (device.status === 'rebooting') {
        return 'device-rebooting';
    }
    if (device.status === 'bootloader-locked') {
        return 'device-bootloader-locked';
    }
    if (device.status === 'hard-locked') {
        return 'device-hard-locked';
    }
    if (device.status === 'pin-locked') {
        return 'device-pin-locked';
    }

    if (device.type === 'acquired') {
        if (!device.available) {
            return 'unavailable';
        }
        if (device.features?.firmware_corrupted) {
            return 'firmware-corrupted';
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

export const isDevicePerceivedAsNew = (device: TrezorDevice | null | undefined) => {
    if (!device) {
        return false;
    }

    const deviceStatus = getStatus(device);

    // NOTE: when a new device is bought and connected = bootloader, when wiped = initialize
    return deviceStatus === 'bootloader' || deviceStatus === 'initialize';
};

export const deviceNeedsAttention = (deviceStatus: DeviceStatus): boolean => {
    switch (deviceStatus) {
        case 'bootloader': // note: this is also state when the device is completely new
        case 'initialize':
        case 'seedless':
        case 'used-in-other-window':
        case 'was-used-in-other-window':
        case 'unacquired':
        case 'firmware-required':
        case 'firmware-corrupted':
        case 'unreadable':
        case 'device-busy':
        case 'device-bootloader-locked':
        case 'device-hard-locked':
        case 'device-pin-locked':
        case 'device-thp-locked':
            return true;

        case 'disconnected':
        case 'unavailable': // this case is already solved in Account view @wallet-components/AccountMode/DeviceUnavailable
        case 'firmware-recommended':
        case 'connected':
        case 'device-rebooting':
        case 'unknown':
        case 'acquired':
            return false;

        default:
            return exhaustive(deviceStatus);
    }
};

export const shouldDisplayInitialWarningIcon = (deviceStatus: DeviceStatus | null) => {
    if (!deviceStatus) {
        return false;
    }

    switch (deviceStatus) {
        case 'bootloader':
        case 'initialize':
        case 'device-thp-locked':
        case 'device-rebooting':
            return false;
        default:
            return true;
    }
};

export const getIsDeviceRemembered = (device?: TrezorDevice): boolean => !!device?.remember;

// Is a Suite extended device acquired (corresponds to Connect "known")
export const isDeviceAcquired = (device?: TrezorDevice): device is AcquiredDevice =>
    !!device?.features;

// Is a Connect device known (corresponds to Suite "acquired")
export const isDeviceKnown = (device?: Device): device is KnownDevice => !!device?.features;

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

export const getFwUpdateVersion = (device: TrezorDevice) =>
    device.firmwareReleaseConfigInfo?.release?.version?.join('.') || null;

export const getCoinUnavailabilityMessage = (reason: UnavailableCapability) => {
    switch (reason) {
        case 'update-required':
            return 'FW_CAPABILITY_UPDATE_REQUIRED';
        case 'trezor-connect-outdated':
            return 'FW_CAPABILITY_CONNECT_OUTDATED';
        // no default
    }
};

/**
 * Generate new instance number
 */
export const getNewInstanceNumber = (devices: TrezorDevice[], device: Pick<KnownDevice, 'id'>) =>
    devices.reduce(
        (instance, d) =>
            d.id === device.id
                ? Math.max(instance ?? 0, d.instance ? d.instance + 1 : 1)
                : instance,
        undefined as number | undefined,
    );

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
        d =>
            d.features &&
            d.instance === device.instance &&
            (d.id ? d.id === device.id : d.path === device.path && d.mode === device.mode), // if id is not present, e.g. in bootloader, fall back to path+mode
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
    const deviceModelInternal = device.features?.internal_model;
    const commit = revision || 'main';
    const isDeviceWithLegacyFirmware = deviceModelInternal === DeviceModelInternal.T1B1;
    const folder = isDeviceWithLegacyFirmware ? 'legacy/firmware' : 'core';
    const changelogFile = isDeviceWithLegacyFirmware
        ? 'CHANGELOG.md'
        : `CHANGELOG.${deviceModelInternal}.md`;

    return `https://github.com/trezor/trezor-firmware/blob/${commit}/${folder}/${changelogFile}`;
};

export const getCheckBackupUrl = (device?: TrezorDevice) => {
    const deviceModelInternal = device?.features?.internal_model;

    if (!deviceModelInternal || deviceModelInternal === DeviceModelInternal.UNKNOWN) {
        return undefined;
    }

    return URLS[`HELP_CENTER_DRY_RUN_${getNarrowedDeviceModelInternal(deviceModelInternal)}_URL`];
};

export const getPackagingUrl = (device?: TrezorDevice) => {
    const deviceModelInternal = device?.features?.internal_model;

    if (!deviceModelInternal || deviceModelInternal === DeviceModelInternal.UNKNOWN) {
        return '';
    }

    return URLS[`HELP_CENTER_PACKAGING_${getNarrowedDeviceModelInternal(deviceModelInternal)}_URL`];
};

export const getFirmwareDowngradeUrl = (device?: TrezorDevice) => {
    const deviceModelInternal = device?.features?.internal_model;

    if (!deviceModelInternal || deviceModelInternal === DeviceModelInternal.UNKNOWN) {
        return undefined;
    }

    return URLS[
        `HELP_CENTER_FW_DOWNGRADE_${getNarrowedDeviceModelInternal(deviceModelInternal)}_URL`
    ];
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

const sortByPriority = (a: TrezorDevice, b: TrezorDevice) => {
    // sort by priority:
    // 1. unacquired
    // 2. unexpected mode
    // 3. outdated firmware
    // 4. timestamp

    // 1
    if (!b.features && !a.features) return 0;
    if (!b.features && a.features) return 1;
    if (!b.features || !a.features) return -1;

    // 2
    if (a.mode !== 'normal' && b.mode !== 'normal') return 0;
    if (b.mode !== 'normal') return 1;
    if (a.mode !== 'normal') return -1;

    // 3
    if (a.firmware !== 'valid' && b.firmware !== 'valid') return 0;
    if (b.firmware !== 'valid') return 1;
    if (a.firmware !== 'valid') return -1;

    // 4
    if (!b.ts && !a.ts) return 0;
    if (!b.ts && a.ts) return -1;
    if (!b.ts || !a.ts) return 1;

    return b.ts - a.ts;
};

export const sortDevicesForDeviceList = (a: TrezorDevice, b: TrezorDevice) => {
    // sort by priority:
    // 1. when the device was first connected - oldests come first
    // when device is "ejected" / completely forgotten, it is last in the list

    if (!b.firstConnectedTimestamp && !a.firstConnectedTimestamp) return 0;
    if (!b.firstConnectedTimestamp && a.firstConnectedTimestamp) return -1;
    if (!b.firstConnectedTimestamp || !a.firstConnectedTimestamp) return 1;

    return a.firstConnectedTimestamp - b.firstConnectedTimestamp;
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
    if (!isDeviceAcquired(device) || !device.id) return [];

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
 * Returns all device instances sorted by `instance` field for all connected and remembered devices
 * * @param {TrezorDevice[]} devices
 * @returns {AcquiredDevice[][]}
 */
export const getDeviceInstancesGroupedByDeviceId = (devices: TrezorDevice[]): AcquiredDevice[][] =>
    devices.reduce((deviceGroups, device) => {
        if (!isDeviceAcquired(device) || !device.id) {
            return deviceGroups;
        }
        const existingGroupIndex = deviceGroups.findIndex(group => group[0].id === device.id);
        if (existingGroupIndex === -1) {
            // If the device ID is not yet in the accumulator, add a new group
            const newGroup = getDeviceInstances(device, devices);
            if (newGroup.length > 0) {
                deviceGroups.push(newGroup);
            }
        }

        return deviceGroups;
    }, [] as AcquiredDevice[][]);

/**
 * Returns first available instance for each device sorted by priority
 * @param {TrezorDevice[]} devices
 * @returns {TrezorDevice[]}
 */
export const getFirstDeviceInstance = (
    devices: TrezorDevice[],
    options: {
        sortingFn: (a: TrezorDevice, b: TrezorDevice) => number;
    } = {
        sortingFn: sortByPriority,
    },
) =>
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
        .sort(options.sortingFn);

export const getPhysicalDeviceUniqueIds = (devices: TrezorDevice[]) =>
    [...new Set(devices.map(d => d.id))].filter(Boolean) as string[];

export const getPhysicalDeviceCount = (devices: TrezorDevice[]) =>
    getPhysicalDeviceUniqueIds(devices).length;

export const getSortedDevicesWithoutInstances = (
    devices: TrezorDevice[],
    excludedDeviceId?: string | null,
) =>
    getDeviceInstancesGroupedByDeviceId(devices)
        .flatMap(group => group[0])
        .filter(d => d?.id !== excludedDeviceId && d?.id)
        .sort((a, b) => {
            if (!a.connected) return -1;
            if (!b.connected) return 1;

            return 0;
        });

export const isDeviceWithButtonOnlyNoTouchscreen = (deviceModel: DeviceModelInternal): boolean => {
    // Technically, the `B` in the DeviceModelInternal means buttons, but let's not rely on this.
    // As it may not be reliable in the future.

    const map: Record<DeviceModelInternal, boolean> = {
        T1B1: true,
        T2B1: true,
        T2T1: false,
        T3B1: true,
        T3T1: false,
        T3W1: false,
        UNKNOWN: false,
    };

    return map[deviceModel];
};

export const isAnyDeviceEventAction = (action: unknown): action is DeviceEvent => {
    if (!hasProp(action, 'type') || typeof action.type !== 'string') {
        return false;
    }

    return isArrayMember(action.type, Object.values(DEVICE));
};

export const getDeviceInternalModel = (
    device?: Pick<Device, 'features' | 'thp'> | undefined,
): DeviceModelInternal =>
    device?.features?.internal_model ??
    (device?.thp?.properties?.internal_model as DeviceModelInternal) ??
    DeviceModelInternal.UNKNOWN;

export const getIsThpDevice = <T extends Device | TrezorDevice>(
    device: T,
): device is T & { thp: NonNullable<Device['thp']> } => device.thp !== undefined;

export const getIsDeviceInitialized = ({
    deviceMode,
    deviceFeatures,
}: {
    deviceMode?: DeviceMode | null;
    deviceFeatures?: PROTO.Features;
}) => deviceMode !== 'initialize' && deviceMode !== 'seedless' && !!deviceFeatures?.initialized;

export const getIsDeviceConnectedAndAuthorized = ({
    deviceState,
    deviceFeatures,
}: {
    deviceState: TrezorDevice['state'];
    deviceFeatures?: PROTO.Features;
}) => !!deviceState && !!deviceFeatures;

export const getIsDeviceDescriptorApiTypeBluetooth = (device: Device | TrezorDevice) =>
    device.descriptor?.apiType === 'bluetooth';

export const getIsDeviceConnectedViaBluetooth = (device?: TrezorDevice): boolean =>
    !!device?.connected && getIsDeviceDescriptorApiTypeBluetooth(device);

export const getIsDevicePinProtected = (device?: TrezorDevice): boolean | null =>
    device?.features?.pin_protection ?? null;

export const getDeviceLanguage = (device?: TrezorDevice): string | null =>
    device?.features?.language ?? null;

export const getDeviceMode = (device?: TrezorDevice): DeviceMode | null => device?.mode ?? null;
