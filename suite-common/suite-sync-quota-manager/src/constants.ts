import { isDevEnv } from '@suite-common/suite-utils';

/**
 * Device size quota is set to 1 MB, which is approximately enough for 2500 label edits.
 */
export const DEFAULT_DEVICE_SIZE_QUOTA = 1024 * 1024;

/**
 * Default account size quota is set to 1/250th of the device size quota,
 * which is approximately enough for 10 label edits.
 */
export const DEFAULT_ACCOUNT_SIZE_QUOTA = Math.round(DEFAULT_DEVICE_SIZE_QUOTA / 250);

export const DEFAULT_QUOTA_MANAGER_URL = isDevEnv
    ? 'https://suite-sync.suite.sldev.cz/gate/'
    : 'https://suite-sync.trezor.io/gate/';
