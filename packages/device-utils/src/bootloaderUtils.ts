import { type VersionArray } from '@trezor/utils/src/versionUtils';

import { getFirmwareOrBootloaderVersionArray } from './firmwareUtils';
import { isDeviceInBootloaderMode } from './modeUtils';
import { type FirmwareVersionString, type PartialDevice } from './types';

export const getBootloaderHash = (device?: PartialDevice) =>
    device?.features?.bootloader_hash || '';

export const getBootloaderVersionArray = (device?: PartialDevice): VersionArray | null => {
    // In Firmware mode it is for now not possible to know the bootloader version.
    if (!device?.features) {
        return null;
    }
    const { features } = device;

    if (isDeviceInBootloaderMode(device) && features.major_version) {
        // `version` is bootloader version when in bootloader mode, in firmware mode it is firmware version.
        return getFirmwareOrBootloaderVersionArray(features);
    }

    return null;
};

export const getBootloaderVersion = (device?: PartialDevice): '' | FirmwareVersionString => {
    const versionArray = getBootloaderVersionArray(device);

    return versionArray === null ? '' : (versionArray.join('.') as FirmwareVersionString);
};
