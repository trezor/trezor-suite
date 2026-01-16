import { getFirmwareOrBootloaderVersionArray } from './firmwareUtils';
import { isDeviceInBootloaderMode } from './modeUtils';
import { FirmwareVersionString, PartialDevice, VersionArray } from './types';

export const getBootloaderHash = (device?: PartialDevice) =>
    device?.features?.bootloader_hash || '';

export const getBootloaderVersionArray = (device?: PartialDevice): VersionArray | null => {
    if (!device?.features) {
        return null;
    }
    const { features } = device;

    if (isDeviceInBootloaderMode(device) && features.major_version) {
        return getFirmwareOrBootloaderVersionArray(features);
    }

    return null;
};

export const getBootloaderVersion = (device?: PartialDevice): '' | FirmwareVersionString => {
    const versionArray = getBootloaderVersionArray(device);

    return versionArray === null ? '' : (versionArray.join('.') as FirmwareVersionString);
};
