import { isDevEnv } from '@suite-common/suite-utils';

// The `https://suite-sync.trezor.io/` MUST have the last `/` in the URL.

export const DEFAULT_SUITE_SYNC_RELAY_URL = isDevEnv
    ? 'https://suite-sync-dev.suite.sldev.cz/evolu/'
    : 'https://suite-sync.trezor.io/evolu/';
