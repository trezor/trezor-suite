import { ConfirmKey } from 'src/actions/backup/backupActions';

/**
 * Utility function used to disable backup start button
 */
export const canStart = (userConfirmed: ConfirmKey[], isDeviceLocked: boolean) =>
    (['has-enough-time', 'is-in-private', 'understands-what-seed-is'] as const).every(e =>
        userConfirmed.includes(e),
    ) && !isDeviceLocked;

/**
 * Utility function used to disable exit button after successful backup
 */
export const canContinue = (userConfirmed: ConfirmKey[], isDeviceLocked?: boolean) =>
    (['wrote-seed-properly', 'made-no-digital-copy', 'will-hide-seed'] as const).every(e =>
        userConfirmed.includes(e),
    ) && !isDeviceLocked;
