import { type PROTO } from '@trezor/connect';

export const isBackupComplete = (features: PROTO.Features): boolean =>
    features.backup_availability === 'NotAvailable';

export const hasSlip39Backup = (features: PROTO.Features): boolean =>
    features.backup_type !== null &&
    features.backup_type !== undefined &&
    features.backup_type !== 'Bip39';
