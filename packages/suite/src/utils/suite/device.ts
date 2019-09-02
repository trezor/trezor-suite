import colors from '@trezor/components/lib/config/colors'; // TODO: fix this import, jest fails on svg parsing
import { InjectedIntl } from 'react-intl';
import l10nMessages from '@suite-components/DeviceMenu/index.messages';
import { TrezorDevice, AcquiredDevice, AppState } from '@suite-types';

type Transport = NonNullable<AppState['suite']['transport']>;

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

export const getStatusName = (deviceStatus: string, intl: InjectedIntl): string => {
    switch (deviceStatus) {
        case 'connected':
            return intl.formatMessage(l10nMessages.TR_CONNECTED);
        case 'disconnected':
            return intl.formatMessage(l10nMessages.TR_DISCONNECTED);
        case 'bootloader':
            return intl.formatMessage(l10nMessages.TR_CONNECTED_BOOTLOADER);
        case 'initialize':
            return intl.formatMessage(l10nMessages.TR_CONNECTED_NOT_INITIALIZED);
        case 'seedless':
            return intl.formatMessage(l10nMessages.TR_CONNECTED_SEEDLESS);
        case 'firmware-required':
            return intl.formatMessage(l10nMessages.TR_CONNECTED_UPDATE_REQUIRED);
        case 'firmware-recommended':
            return intl.formatMessage(l10nMessages.TR_CONNECTED_UPDATE_RECOMMENDED);
        case 'used-in-other-window':
            return intl.formatMessage(l10nMessages.TR_USED_IN_ANOTHER_WINDOW);
        case 'was-used-in-other-window':
            return intl.formatMessage(l10nMessages.TR_WAS_USED_IN_ANOTHER_WINDOW);
        case 'unacquired':
            return intl.formatMessage(l10nMessages.TR_USED_IN_ANOTHER_WINDOW);
        case 'unavailable':
            return intl.formatMessage(l10nMessages.TR_UNAVAILABLE);
        case 'unreadable':
            return intl.formatMessage(l10nMessages.TR_UNREADABLE);
        default:
            return intl.formatMessage(l10nMessages.TR_STATUS_UNKNOWN);
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

export const isWebUSB = (transport?: Transport) =>
    !!(transport && transport.type && transport.type === 'webusb');

/*
TODO: is this util used anywhere?
export const isDisabled = (
    selectedDevice: TrezorDevice,
    devices: TrezorDevice[],
    transport: Transport,
) => {
    if (isWebUSB(transport)) return false; // always enabled if webusb
    if (devices.length < 1) return true; // no devices
    if (devices.length === 1) {
        if (!selectedDevice.features) return true; // unacquired, unreadable
        if (selectedDevice.mode !== 'normal') return true; // bootloader, not initialized, seedless
        if (selectedDevice.firmware === 'required') return true;
    }
    return false; // default
};
*/

export const isDeviceAccessible = (device?: TrezorDevice) => {
    if (!device || !device.features) return false;
    return device.mode === 'normal' && device.firmware !== 'required';
};

export const isSelectedDevice = (selected?: TrezorDevice, device?: TrezorDevice) =>
    !!(
        selected &&
        device &&
        selected.path === device.path &&
        selected.instance === device.instance
    );

export const getVersion = (device: TrezorDevice): string => {
    const { features } = device;
    return features && features.major_version > 1 ? 'T' : 'One';
};

/**
 * Generate new instance number
 * @param {TrezorDevice[]} devices
 * @param {AcquiredDevice} device
 * @returns number
 */
export const getNewInstanceNumber = (devices: TrezorDevice[], device: AcquiredDevice) => {
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
 * @returns
 */
export const getSelectedDevice = (device: TrezorDevice, devices: TrezorDevice[]) => {
    // selected device is not acquired
    if (!device.features) return devices.find(d => d.path === device.path);
    const { path, instance, features } = device;

    return devices.find(d => {
        if ((!d.features || d.mode === 'bootloader') && d.path === path) {
            return true;
        }
        if (d.features && d.features.device_id === features.device_id && d.instance === instance) {
            return true;
        }
        return false;
    });
};

/**
 * Sort devices by "ts" field
 * @param {TrezorDevice[]} devices
 * @returns
 */
export const sort = (devices: TrezorDevice[]) => {
    return devices.sort((a, b) => {
        if (!a.ts || !b.ts) {
            return -1;
        }
        return a.ts > b.ts ? -1 : 1;
    });
};
