/**
 * Device size quota is set to 1 MB, which is approximately enough for 2500 label edits.
 */
export const DEFAULT_DEVICE_SIZE_QUOTA = 1024 * 1024;

/**
 * Default account size quota is set to 1/250th of the device size quota,
 * which is approximately enough for 10 label edits.
 */
export const DEFAULT_ACCOUNT_SIZE_QUOTA = Math.round(DEFAULT_DEVICE_SIZE_QUOTA / 100);

/**
 * Default increment account size quota that is used for incrementing quota when no account store is left.
 */
export const DEFAULT_ACCOUNT_INCREMENT_SIZE_QUOTA = DEFAULT_ACCOUNT_SIZE_QUOTA;
