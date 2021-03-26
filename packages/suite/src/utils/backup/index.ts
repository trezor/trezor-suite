import { ConfirmKey } from '@backup-actions/backupActions';
import { Lock } from '@suite-types';
import { SUITE } from '@suite-actions/constants';
/**
 * Utility function used to disable backup start button
 */
export const canStart = (userConfirmed: ConfirmKey[], locks: Lock[]) =>
    (['has-enough-time', 'is-in-private', 'understands-what-seed-is'] as const).every(e =>
        userConfirmed.includes(e),
    ) && !locks.includes(SUITE.LOCK_TYPE.DEVICE);

/**
 * Utility function used to disable exit button after successful backup
 */
export const canContinue = (userConfirmed: ConfirmKey[], locks?: Lock[]) =>
    (['wrote-seed-properly', 'made-no-digital-copy', 'will-hide-seed'] as const).every(e =>
        userConfirmed.includes(e),
    ) && !locks?.includes(SUITE.LOCK_TYPE.DEVICE);
