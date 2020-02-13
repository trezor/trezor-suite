import { ConfirmKey } from '@backup-actions/backupActions';
import { Lock } from '@suite-types';
/**
 * Utility function used to disable backup start button
 */
export const canStart = (userConfirmed: ConfirmKey[], locks: Lock[]) =>
    (['has-enough-time', 'is-in-private', 'understands-what-seed-is'] as const).every(e =>
        userConfirmed.includes(e),
    ) && !locks.includes(2);

/**
 * Utility function used to disable exit button after successful backup
 */
export const canContinue = (userConfirmed: ConfirmKey[]) =>
    (['wrote-seed-properly', 'made-no-digital-copy', 'will-hide-seed'] as const).every(e =>
        userConfirmed.includes(e),
    );
