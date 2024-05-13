import { PROTO } from '@trezor/connect';

export const isAdditionalShamirBackupInProgress = (features: PROTO.Features) =>
    features.recovery_status === 'Backup' &&
    features.recovery_type === undefined &&
    features.backup_availability === 'Available';

export const isRecoveryInProgress = (features: PROTO.Features) => {
    const { recovery_status, backup_availability } = features;

    if (recovery_status === undefined) {
        return false;
    }

    if (recovery_status === 'Recovery') {
        return true;
    }

    const isShamirAdditionalBackupRecovery =
        recovery_status === 'Backup' && backup_availability === 'NotAvailable';

    if (isShamirAdditionalBackupRecovery) {
        return true;
    }

    return false;
};
