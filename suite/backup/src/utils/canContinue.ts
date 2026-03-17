/**
 * TODO: use the one from backupActions when its refactored into a suite package!!!
 */
export type ConfirmKey =
    | 'has-enough-time'
    | 'is-in-private'
    | 'understands-what-seed-is'
    | 'wrote-seed-properly'
    | 'made-no-digital-copy'
    | 'will-hide-seed';

/**
 * Utility function used to disable exit button after successful backup
 */
export const canContinue = (userConfirmed: ConfirmKey[], isDeviceLocked?: boolean) =>
    (['wrote-seed-properly', 'made-no-digital-copy', 'will-hide-seed'] as const).every(e =>
        userConfirmed.includes(e),
    ) && !isDeviceLocked;
