import { type PROTO } from '@trezor/connect';

export { isAdditionalShamirBackupInProgress } from '@suite-common/backup';

export const isRecoveryInProgress = (features: PROTO.Features) => {
    const { recovery_status, backup_availability } = features;

    if (recovery_status === undefined) {
        return false;
    }

    if (recovery_status === 'Recovery') {
        return true;
    }

    return recovery_status === 'Backup' && backup_availability === 'NotAvailable';
};
