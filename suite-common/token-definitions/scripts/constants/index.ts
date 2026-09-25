import { join, resolve } from 'path';

import { VERSION } from '../../src/tokenDefinitionsConstants';

export const PACKAGE_ROOT = resolve(__dirname, '..', '..');

export const SCHEMA_FILENAME_SUFFIX = `schema.v${VERSION}.json`;
export const DEFINITIONS_FILENAME_SUFFIX = `definitions.v${VERSION}`;

// The ranked definitions cover every platform of a run, so they take no platform id in the name.
export const RANKED_STRUCTURE = 'ranked';

export const SCHEMA_PATH = join(PACKAGE_ROOT, 'schema');
export const FILES_PATH = join(PACKAGE_ROOT, 'files');

export const NFT_LIST_URL = 'https://pro-api.coingecko.com/api/v3/nfts/list';
export const COIN_LIST_URL = 'https://pro-api.coingecko.com/api/v3/coins/list';
export const COIN_MARKETS_URL = 'https://pro-api.coingecko.com/api/v3/coins/markets';

export const STELLAR_HORIZON_URL = 'https://horizon.stellar.org';
export const STELLAR_EXPERT_URL = 'https://api.stellar.expert/explorer/public';

export const NFTS_PER_PAGE = 250;

export const MARKET_CAPS_PER_PAGE = 250;
// CoinGecko lists roughly 20k coins. The cap only keeps a misbehaving API from paging forever.
export const MARKET_CAPS_MAX_PAGES = 200;
export const MARKET_CAPS_MAX_ATTEMPTS = 4;
export const MARKET_CAPS_RETRY_DELAY_MS = 2_000;
export const MARKET_CAP_FIAT_CURRENCY = 'usd';
// Paging by id keeps the list stable across the requests one run makes. Ordering by market cap
// reranks live, which silently drops any coin that crosses a page boundary mid-run.
export const MARKET_CAPS_ORDER = 'id_asc';
// Market cap stored for a token CoinGecko reports none for, so that it still ends up in the
// definitions as a known token.
export const UNKNOWN_MARKET_CAP = 0;

export const YIELD_VAULTS_URL = 'https://earn.trezor.io/yield/vaults/v1';
