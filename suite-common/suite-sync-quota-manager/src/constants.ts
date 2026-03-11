import { isDevEnv } from '@suite-common/suite-utils';

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

export const DEFAULT_QUOTA_MANAGER_URL = isDevEnv
    ? 'https://suite-sync-dev.suite.sldev.cz/quota-manager/'
    : 'https://suite-sync.trezor.io/quota-manager/';

/**
 * Header used for signing add space to owner requests.
 */
export const EVOLU_SIGN_ADD_SPACE_TO_OWNER_REQUEST_HEADER = 'EvoluAddSpaceToOwnerV1';
