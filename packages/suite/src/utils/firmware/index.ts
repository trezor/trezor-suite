import { valid, satisfies } from 'semver';
import { getFirmwareVersion } from '@trezor/device-utils';

import { type AppState, type TrezorDevice, type ExtendedMessageDescriptor } from 'src/types/suite';
import { DeviceModelInternal, FirmwareType } from '@trezor/connect';

export const getFormattedFingerprint = (fingerprint: string) =>
    [
        fingerprint.substring(0, 16),
        fingerprint.substring(16, 32),
        fingerprint.substring(32, 48),
        fingerprint.substring(48, 64),
    ]
        .join('\n')
        .toUpperCase();

export const getTextForStatus = (status: AppState['firmware']['status']) => {
    switch (status) {
        case 'started':
        case 'installing':
            return 'TR_INSTALLING';
        case 'wait-for-reboot':
            return 'TR_WAIT_FOR_REBOOT';
        case 'validation':
            return 'TR_VALIDATION';
        case 'unplug':
        case 'reconnect-in-normal':
        case 'done':
        case 'partially-done':
            return 'TR_FIRMWARE_STATUS_INSTALLATION_COMPLETED';
        default:
            return null;
    }
};

export const getDescriptionForStatus = (
    status: AppState['firmware']['status'],
    webUSB?: boolean,
) => {
    switch (status) {
        case 'started':
        case 'installing':
            return 'TR_DO_NOT_DISCONNECT';
        case 'wait-for-reboot':
            return webUSB ? 'TR_WAIT_FOR_REBOOT_WEBUSB_DESCRIPTION' : 'TR_DO_NOT_DISCONNECT';
        default:
            return null;
    }
};

// naming is based on fw version and chip, not model
enum FirmwareFormat {
    'T1' = 1,
    'T1_EMBEDDED_V2',
    'T1_V2',
    'T2',
}

const FORMAT_MAP: { [format in FirmwareFormat]: DeviceModelInternal[] } = {
    [FirmwareFormat.T1]: [DeviceModelInternal.T1B1],
    [FirmwareFormat.T1_EMBEDDED_V2]: [DeviceModelInternal.T1B1],
    [FirmwareFormat.T1_V2]: [DeviceModelInternal.T1B1],
    [FirmwareFormat.T2]: [DeviceModelInternal.T2T1, DeviceModelInternal.T2B1],
};

export const parseFirmwareFormat = (fw: ArrayBuffer): FirmwareFormat | undefined => {
    const firmwareView = new Uint8Array(fw);
    const header = String.fromCharCode(...Array.from(firmwareView.slice(0, 4)));

    switch (header) {
        case 'TRZR': {
            const headerEmbedded = String.fromCharCode(...Array.from(firmwareView.slice(256, 260)));

            return headerEmbedded === 'TRZF' ? FirmwareFormat.T1_EMBEDDED_V2 : FirmwareFormat.T1;
        }
        case 'TRZF':
            return FirmwareFormat.T1_V2;
        case 'TRZV':
            return FirmwareFormat.T2;
        // no default
    }
};

export const validateFirmware = (
    fw: ArrayBuffer,
    device: TrezorDevice | undefined,
): ExtendedMessageDescriptor['id'] | undefined => {
    const deviceModelInternal = device?.features?.internal_model;

    if (!deviceModelInternal) {
        return 'TR_UNKNOWN_DEVICE';
    }

    const firmwareVersion = getFirmwareVersion(device);
    const firmwareFormat = parseFirmwareFormat(fw);

    if (!firmwareFormat) {
        return 'TR_FIRMWARE_VALIDATION_UNRECOGNIZED_FORMAT';
    }
    if (!FORMAT_MAP[firmwareFormat].includes(deviceModelInternal)) {
        return 'TR_FIRMWARE_VALIDATION_UNMATCHING_DEVICE';
    }

    const isT1V2 = valid(firmwareVersion) && satisfies(firmwareVersion, '>=1.8.0 <2.0.0');

    if (isT1V2 && firmwareFormat === FirmwareFormat.T1) {
        return 'TR_FIRMWARE_VALIDATION_TOO_OLD';
    }
    if (!isT1V2 && firmwareFormat === FirmwareFormat.T1_V2) {
        return 'TR_FIRMWARE_VALIDATION_T1_V2';
    }
};

export const getSuiteFirmwareTypeString = (firmwareType?: FirmwareType) => {
    switch (firmwareType) {
        case FirmwareType.BitcoinOnly:
            return 'TR_FIRMWARE_TYPE_BITCOIN_ONLY';
        case FirmwareType.Regular:
            return 'TR_FIRMWARE_TYPE_REGULAR';
        default:
            return undefined;
    }
};
