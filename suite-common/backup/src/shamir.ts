import { type PROTO } from '@trezor/connect';

const BACKUP_TYPE_EXTENDABILITY: Record<PROTO.BackupType, boolean> = {
    Slip39_Single_Extendable: true,
    Slip39_Basic_Extendable: true,
    Slip39_Advanced_Extendable: true,
    Slip39_Advanced: false,
    Slip39_Basic: false,
    Bip39: false,
};

export const hasExtendableShamirBackup = (features: PROTO.Features): boolean =>
    features.backup_type != null && BACKUP_TYPE_EXTENDABILITY[features.backup_type];

export const doesSupportMultiShare = (features: PROTO.Features): boolean =>
    features.capabilities?.includes('Capability_Shamir') === true &&
    hasExtendableShamirBackup(features);

export const isAdditionalShamirBackupInProgress = (features: PROTO.Features): boolean =>
    features.recovery_status === 'Backup' &&
    (features.recovery_type === undefined || features.recovery_type === null) &&
    features.backup_availability === 'Available';
