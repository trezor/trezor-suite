import { AppState } from '@suite-types';

export const getFormattedFingerprint = (fingerprint: string) => {
    return [
        fingerprint.substr(0, 16),
        fingerprint.substr(16, 16),
        fingerprint.substr(32, 16),
        fingerprint.substr(48, 16),
    ]
        .join('\n')
        .toUpperCase();
};

export const getTextForStatus = (status: AppState['firmware']['status']) => {
    switch (status) {
        case 'waiting-for-confirmation':
            return 'TR_WAITING_FOR_CONFIRMATION';
        case 'installing':
            return 'TR_INSTALLING';
        case 'downloading':
            return 'TR_DOWNLOADING';
        case 'wait-for-reboot':
            return 'TR_WAIT_FOR_REBOOT';
        case 'unplug':
            return 'TR_DISCONNECT_YOUR_DEVICE';
        case 'check-fingerprint':
            return 'TR_CHECK_FINGERPRINT';
        // case 'started' is intentionally omitted;
        default:
            return null;
    }
};
export const getDescriptionForStatus = (status: AppState['firmware']['status']) => {
    switch (status) {
        case 'wait-for-reboot':
            return 'TR_DO_NOT_DISCONNECT';
        default:
            return null;
    }
};
