import { join, resolve } from 'path';

import { VERSION } from '../../src/tokenDefinitionsConstants';

export const PACKAGE_ROOT = resolve(__dirname, '..', '..');

export const SCHEMA_FILENAME_SUFFIX = `schema.v${VERSION}.json`;
export const DEFINITIONS_FILENAME_SUFFIX = `definitions.v${VERSION}`;

export const SCHEMA_PATH = join(PACKAGE_ROOT, 'schema');
export const FILES_PATH = join(PACKAGE_ROOT, 'files');

export const COINGECKO_API_URL = 'https://pro-api.coingecko.com/api/v3';

export const STELLAR_HORIZON_URL = 'https://horizon.stellar.org';
export const STELLAR_EXPERT_URL = 'https://api.stellar.expert/explorer/public';

export const NFTS_PER_PAGE = 250;

export const MARKET_CAP_FIAT_CURRENCY = 'usd';
// `/coins/markets` accepts at most 250 ids per request.
export const MARKET_CAPS_IDS_PER_REQUEST = 250;
// Market cap stored for a token CoinGecko reports none for, so that it is still ranked, last.
export const UNKNOWN_MARKET_CAP = 0;

// The ranked definitions cover every platform of a run, so they take no platform id in the name.
export const RANKED_STRUCTURE = 'ranked';

// Attempts made after the first one, each waiting three times as long as the retry before it.
export const REQUEST_RETRIES = 3;
export const REQUEST_RETRY_BASE_DELAY_MS = 1_000;
// Ceiling for a `Retry-After` the server asks for, so one unusable header cannot park the build.
export const REQUEST_RETRY_MAX_DELAY_MS = 60_000;
export const REQUEST_TIMEOUT_MS = 20_000;
export const REQUEST_MIN_GAP_MS = 250;

export const YIELD_VAULTS_URL = 'https://earn.trezor.io/yield/vaults/v1';
