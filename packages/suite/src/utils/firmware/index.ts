import { AppState } from '@suite-types';

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
