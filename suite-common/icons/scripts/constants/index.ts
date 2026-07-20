import { join, resolve } from 'path';

import { ICONS_URL_BASE } from '../../src/coinImages';

export const PACKAGE_ROOT = resolve(__dirname, '..', '..');

export const FILES_CRYPTOICONS_PATH = join(PACKAGE_ROOT, 'files', 'cryptoIcons');
export const UPDATED_ICONS_LIST_FILE = join(FILES_CRYPTOICONS_PATH, 'icons.json');
export const UPDATED_ICONS_LIST_URL = join(ICONS_URL_BASE, 'icons.json');

export const COIN_LIST_URL = 'https://pro-api.coingecko.com/api/v3/coins/list';
export const COIN_DATA_URL = 'https://pro-api.coingecko.com/api/v3/coins/';
export const COIN_MARKETS_URL = 'https://pro-api.coingecko.com/api/v3/coins/markets';

export const RATE_LIMIT_PER_MINUTE = 240;
export const RUN_LIMIT_SECONDS = 4 * 60 * 60; // 4 hour

// /coins/markets returns image URLs in bulk (max 250 per page), letting us avoid one
// /coins/{id} call per coin. MAX_PAGES is a safety cap above the ~72 pages needed for ~18k coins.
export const COIN_MARKETS_PER_PAGE = 250;
export const COIN_MARKETS_MAX_PAGES = 120;
