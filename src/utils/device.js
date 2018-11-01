/* @flow */

import colors from 'config/colors';

import type { Device } from 'trezor-connect';
import type {
    TrezorDevice,
    State,
} from 'flowtype';

type Transport = $ElementType<$ElementType<State, 'connect'>, 'transport'>;

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
    if (!device.available) { // deprecated
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

export const getStatusName = (deviceStatus: string): string => {
    switch (deviceStatus) {
        case 'connected':
            return 'Connected';
        case 'disconnected':
            return 'Disconnected';
        case 'bootloader':
            return 'Connected (bootloader mode)';
        case 'initialize':
            return 'Connected (not initialized)';
        case 'seedless':
            return 'Connected (seedless mode)';
        case 'firmware-required':
            return 'Connected (update required)';
        case 'firmware-recommended':
            return 'Connected (update recommended)';
        case 'used-in-other-window':
            return 'Used in other window';
        case 'unacquired':
            return 'Used in other window';
        case 'unavailable':
            return 'Unavailable';
        case 'unreadable':
            return 'Unreadable';
        default:
            return 'Status unknown';
    }
};

export const isWebUSB = (transport: Transport) => !!((transport.type && transport.version.indexOf('webusb') >= 0));

export const isDisabled = (selectedDevice: TrezorDevice, devices: Array<TrezorDevice>, transport: Transport) => {
    if (isWebUSB(transport)) return false; // always enabled if webusb
    if (devices.length < 1) return true; // no devices
    if (devices.length === 1) {
        if (!selectedDevice.features) return true; // unacquired, unreadable
        if (selectedDevice.mode !== 'normal') return true; // bootloader, not initialized, seedless
        if (selectedDevice.firmware === 'required') return true;
    }
    return false; // default
};

export const isDeviceAccessible = (device: ?TrezorDevice): boolean => {
    if (!device || !device.features) return false;
    return device.mode === 'normal' && device.firmware !== 'required';
};

export const isSelectedDevice = (selected: ?TrezorDevice, device: ?(TrezorDevice | Device)): boolean => !!((selected && device && (selected.path === device.path && (device.ts && selected.instance === device.instance))));

export const getVersion = (device: TrezorDevice): string => {
    let version;
    if (device.features && device.features.major_version > 1) {
        version = 'T';
    } else {
        version = '1';
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