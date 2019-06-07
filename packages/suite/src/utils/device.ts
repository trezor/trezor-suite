import { colors } from '@trezor/components';
import { TrezorDevice } from '@suite/types';
import l10nMessages from '../components/DeviceItem/index.messages';

export const getStatus = (device: TrezorDevice): string => {
    if (!device.connected) {
        return 'disconnected';
    }
    if (device.type === 'acquired') {
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
            return 'used-in-other-window';
        }
        if (device.firmware === 'outdated') {
            return 'firmware-recommended';
        }
        return 'connected';
    }
    if (!device.available) {
        // deprecated
        return 'unavailable';
    }
    if (device.type === 'unacquired') {
        return 'unacquired';
    }
    if (device.type === 'unreadable') {
        return 'unreadable';
    }
    return 'unknown';
};

export const getStatusName = (deviceStatus: string, intl): string => {
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

export const isWebUSB = transport => !!(transport.type && transport.type === 'webusb');

export const isDisabled = (selectedDevice: SelectedDevice, devices: TrezorDevice[], transport) => {
    if (isWebUSB(transport)) return false; // always enabled if webusb
    if (devices.length < 1) return true; // no devices
    if (devices.length === 1) {
        if (!selectedDevice.features) return true; // unacquired, unreadable
        if (selectedDevice.mode !== 'normal') return true; // bootloader, not initialized, seedless
        if (selectedDevice.firmware === 'required') return true;
    }
    return false; // default
};

export const isDeviceAccessible = (device: SelectedDevice): boolean => {
    if (!device || !device.features) return false;
    return device.mode === 'normal' && device.firmware !== 'required';
};

export const isSelectedDevice = (selected: SelectedDevice, device: TrezorDevice): boolean =>
    !!(
        selected &&
        device &&
        (selected.path === device.path && (device.ts && selected.instance === device.instance))
    );

export const getVersion = (device: TrezorDevice): string => {
    let version;
    if (device.features && device.features.major_version > 1) {
        version = 'T';
    } else {
        version = 'One';
    }
    return version;
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
