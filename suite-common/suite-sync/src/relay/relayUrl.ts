import { isCodesignBuild } from '@trezor/env-utils';

// The `https://suite-sync.trezor.io/` MUST have the last `/` in the URL.

export const DEFAULT_SUITE_SYNC_RELAY_URL = isCodesignBuild()
    ? 'https://suite-sync.trezor.io/evolu/'
    : 'https://suite-sync-dev.suite.sldev.cz/evolu/';
