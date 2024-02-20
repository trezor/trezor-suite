import { FirmwareType, Device, VersionArray } from '@trezor/connect';

import { isDeviceInBootloaderMode } from './modeUtils';

export const getFirmwareRevision = (device?: Device) => device?.features?.revision || '';

export const getFirmwareVersionArray = (device?: Device): VersionArray | null => {
    if (!device?.features) {
        return null;
    }
    const { features } = device;

    if (isDeviceInBootloaderMode(device)) {
        return features.fw_major
            ? ([features.fw_major, features.fw_minor, features.fw_patch] as VersionArray)
            : null;
    }

    return [features.major_version, features.minor_version, features.patch_version];
};

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

// This can give a false negative in bootloader mode for T1B1 and T2T1.
export const hasBitcoinOnlyFirmware = (device?: Device) =>
    device?.firmwareType === FirmwareType.BitcoinOnly;

// Bitcoin-only device with Universal firmware is treated as a regular device.
export const isBitcoinOnlyDevice = (device?: Device) =>
    !!device?.features?.unit_btconly && device?.firmwareType !== FirmwareType.Regular;
