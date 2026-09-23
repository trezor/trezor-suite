import { join, resolve } from 'path';

import { VERSION } from '../../src/tokenDefinitionsConstants';

export const PACKAGE_ROOT = resolve(__dirname, '..', '..');

export const SCHEMA_FILENAME_SUFFIX = `schema.v${VERSION}.json`;
export const DEFINITIONS_FILENAME_SUFFIX = `definitions.v${VERSION}`;

export const SCHEMA_PATH = join(PACKAGE_ROOT, 'schema');
export const FILES_PATH = join(PACKAGE_ROOT, 'files');

export const NFT_LIST_URL = 'https://pro-api.coingecko.com/api/v3/nfts/list';
export const COIN_LIST_URL = 'https://pro-api.coingecko.com/api/v3/coins/list';

export const STELLAR_HORIZON_URL = 'https://horizon.stellar.org';
export const STELLAR_EXPERT_URL = 'https://api.stellar.expert/explorer/public';

export const NFTS_PER_PAGE = 250;

// One entry per attempt, holding the pause taken before the attempt that follows it.
export const REQUEST_RETRY_GAPS_MS = [1_000, 3_000, 9_000];
export const REQUEST_TIMEOUT_MS = 20_000;
export const REQUEST_MIN_GAP_MS = 250;

export const YIELD_VAULTS_URL = 'https://earn.trezor.io/yield/vaults/v1';
