import { type PROTO } from '@trezor/connect';

export const isBackupComplete = (features: PROTO.Features): boolean =>
    features.backup_availability === 'NotAvailable';

export const hasNonWordlistBackup = (features: PROTO.Features): boolean =>
    features.backup_type != null && features.backup_type !== 'Bip39';
