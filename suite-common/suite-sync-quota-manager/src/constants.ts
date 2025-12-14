import { isDevEnv } from '@suite-common/suite-utils';

export const DEFAULT_DEVICE_SIZE_QUOTA = 1024 * 1024 * 50; // 50 MB
export const DEFAULT_OWNER_SIZE_QUOTA = 1024 * 1024 * 2; // 2 MB

export const DEFAULT_QUOTA_MANAGER_URL = isDevEnv
    ? 'https://suite-sync.suite.sldev.cz/gate/'
    : 'https://suite-sync.trezor.io/gate/';
