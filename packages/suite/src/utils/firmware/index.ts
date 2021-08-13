import { valid, satisfies } from 'semver';
import type { AppState, TrezorDevice, ExtendedMessageDescriptor } from '@suite-types';
import { getDeviceModel, getFwVersion } from '@suite-utils/device';

export const getFormattedFingerprint = (fingerprint: string) =>
    [
        fingerprint.substr(0, 16),
        fingerprint.substr(16, 16),
        fingerprint.substr(32, 16),
        fingerprint.substr(48, 16),
    ]
        .join('\n')
        .toUpperCase();

export const getTextForStatus = (status: AppState['firmware']['status']) => {
    switch (status) {
        case 'started':
        case 'installing':
            return 'TR_INSTALLING';
        case 'unplug':
        case 'reconnect-in-normal':
        case 'done':
        case 'partially-done':
            return 'TR_FIRMWARE_STATUS_INSTALLATION_COMPLETED';
        case 'wait-for-reboot':
            return 'TR_WAIT_FOR_REBOOT';
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

export type FirmwareFormat = 'ONE' | 'ONE_EMBEDDED_V2' | 'ONE_V2' | 'T';

const FORMAT_MAP: { [format in FirmwareFormat]: ReturnType<typeof getDeviceModel> } = {
    ONE: '1',
    ONE_EMBEDDED_V2: '1',
    ONE_V2: '1',
    T: 'T',
};

export const parseFirmwareFormat = (fw: ArrayBuffer): FirmwareFormat | undefined => {
    const fwView = new Uint8Array(fw);
    const header = String.fromCharCode(...Array.from(fwView.slice(0, 4)));
    switch (header) {
        case 'TRZR': {
            const headerEmbedded = String.fromCharCode(...Array.from(fwView.slice(256, 260)));
            return headerEmbedded === 'TRZF' ? 'ONE_EMBEDDED_V2' : 'ONE';
        }
        case 'TRZF':
            return 'ONE_V2';
        case 'TRZV':
            return 'T';
        default:
            return undefined;
    }
};

export const validateFirmware = (
    fw: ArrayBuffer,
    device: TrezorDevice | undefined,
): ExtendedMessageDescriptor['id'] | undefined => {
    if (!device?.features) {
        return 'TR_UNKNOWN_DEVICE';
    }

    const deviceModel = getDeviceModel(device);
    const deviceVersion = getFwVersion(device);
    const format = parseFirmwareFormat(fw);

    if (!format) {
        return 'TR_FIRMWARE_VALIDATION_UNRECOGNIZED_FORMAT';
    }
    if (FORMAT_MAP[format] !== deviceModel) {
        return 'TR_FIRMWARE_VALIDATION_UNMATCHING_DEVICE';
    }

    const isOneV2 = valid(deviceVersion) && satisfies(deviceVersion, '>=1.8.0 <2.0.0');

    if (isOneV2 && format === 'ONE') {
        return 'TR_FIRMWARE_VALIDATION_TOO_OLD';
    }
    if (!isOneV2 && format === 'ONE_V2') {
        return 'TR_FIRMWARE_VALIDATION_ONE_V2';
    }
};
