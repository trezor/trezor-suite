import { type PROTO } from '@trezor/connect';

import { type ConfirmKey } from './types';

/**
 * Utility function used to disable exit button after successful backup
 */
export const canContinue = (userConfirmed: ConfirmKey[], isDeviceLocked?: boolean) =>
    (['wrote-seed-properly', 'made-no-digital-copy', 'will-hide-seed'] as const).every(e =>
        userConfirmed.includes(e),
    ) && !isDeviceLocked;

export const isBackupComplete = (features: PROTO.Features): boolean =>
    features.backup_availability === 'NotAvailable';

export const hasNonWordlistBackup = (features: PROTO.Features): boolean =>
    features.backup_type != null && features.backup_type !== 'Bip39';
