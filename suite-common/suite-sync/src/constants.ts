import { isDevEnv } from '@suite-common/suite-utils';

export const SUITE_SYNC_STORAGE_PREFIX = '@suite/suite-sync';

// The `https://suite-sync.trezor.io/` MUST have the last `/` in the URL.
export const DEFAULT_SUITE_SYNC_RELAY_URL = isDevEnv
    ? 'https://evolu.suite.sldev.cz/evolu/'
    : 'https://suite-sync.trezor.io/';
