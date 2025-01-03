import { ConfirmKey } from 'src/actions/backup/backupActions';

/**
 * Utility function used to disable exit button after successful backup
 */
export const canContinue = (userConfirmed: ConfirmKey[], isDeviceLocked?: boolean) =>
    (['wrote-seed-properly', 'made-no-digital-copy', 'will-hide-seed'] as const).every(e =>
        userConfirmed.includes(e),
    ) && !isDeviceLocked;
