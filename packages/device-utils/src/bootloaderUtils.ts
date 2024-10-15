import { isDeviceInBootloaderMode } from './modeUtils';
import { PartialDevice } from './types';

export const getBootloaderHash = (device?: PartialDevice) =>
    device?.features?.bootloader_hash || '';

export const getBootloaderVersion = (device?: PartialDevice) => {
    if (!device?.features) {
        return '';
    }
    const { features } = device;

    if (isDeviceInBootloaderMode(device) && features.major_version) {
        return `${features.major_version}.${features.minor_version}.${features.patch_version}`;
    }

    return '';
};
