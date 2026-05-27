import { type PROTO } from '@trezor/connect';

import { EXTENDABLE_SHAMIR_BACKUP_TYPES } from './shamirConstants';

export const hasExtendableShamirBackup = (features: PROTO.Features): boolean =>
    features.backup_type != null && EXTENDABLE_SHAMIR_BACKUP_TYPES.includes(features.backup_type);

export const isAdditionalShamirBackupInProgress = (features: PROTO.Features): boolean =>
    features.recovery_status === 'Backup' &&
    (features.recovery_type === undefined || features.recovery_type === null) &&
    features.backup_availability === 'Available';
