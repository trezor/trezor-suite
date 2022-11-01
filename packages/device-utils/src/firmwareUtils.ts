import { PartialDevice } from './types';
import { isDeviceInBootloaderMode } from './modeUtils';

export const getFirmwareRevision = (device?: PartialDevice) => device?.features?.revision || '';

export const getFirmwareVersion = (device?: PartialDevice) => {
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

export const getFirmwareType = (device?: PartialDevice) => {
    if (isDeviceInBootloaderMode(device)) {
        return '';
    }
    return device?.firmwareType === 'bitcoin-only' ? 'Bitcoin-only' : 'Universal';
};
