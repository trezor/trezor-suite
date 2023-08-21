import { Device } from '@trezor/connect';

import { isDeviceInBootloaderMode } from './modeUtils';

export const getBootloaderHash = (device?: Device) => device?.features?.bootloader_hash || '';

export const getBootloaderVersion = (device?: Device) => {
    if (!device?.features) {
        return '';
    }
    const { features } = device;

    if (isDeviceInBootloaderMode(device) && features.major_version) {
        return `${features.major_version}.${features.minor_version}.${features.patch_version}`;
    }

    return '';
};
