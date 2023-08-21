import { FirmwareType, Device } from '@trezor/connect';

import { isDeviceInBootloaderMode } from './modeUtils';

export const getFirmwareRevision = (device?: Device) => device?.features?.revision || '';

export const getFirmwareVersion = (device?: Device) => {
    if (!device?.features) {
        return '';
    }
    const { features } = device;

    if (isDeviceInBootloaderMode(device)) {
        return features.fw_major
            ? `${features.fw_major}.${features.fw_minor}.${features.fw_patch}`
            : '';
    }

    return `${features.major_version}.${features.minor_version}.${features.patch_version}`;
};

export const hasBitcoinOnlyFirmware = (device?: Device) =>
    device?.firmwareType === FirmwareType.BitcoinOnly;
