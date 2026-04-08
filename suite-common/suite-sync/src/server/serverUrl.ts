import { isCodesignBuild } from '@trezor/env-utils';

const DEFAULT_SUITE_SYNC_SERVER_URL_DEV = 'https://suite-sync-dev.suite.sldev.cz/evolu/';
const DEFAULT_SUITE_SYNC_SERVER_URL_PROD = 'https://suite-sync.trezor.io/evolu/';

export const SUITE_SYNC_SERVERS = [
    DEFAULT_SUITE_SYNC_SERVER_URL_DEV,
    DEFAULT_SUITE_SYNC_SERVER_URL_PROD,
];

// The `https://suite-sync.trezor.io/` MUST have the last `/` in the URL.

export const DEFAULT_SUITE_SYNC_SERVER_URL = isCodesignBuild()
    ? DEFAULT_SUITE_SYNC_SERVER_URL_PROD
    : DEFAULT_SUITE_SYNC_SERVER_URL_DEV;
