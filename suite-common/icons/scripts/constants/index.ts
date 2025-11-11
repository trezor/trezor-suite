import { join, resolve } from 'path';

import { ICONS_URL_BASE } from '../../src/coinImages';

export const PACKAGE_ROOT = resolve(__dirname, '..', '..');

export const FILES_CRYPTOICONS_PATH = join(PACKAGE_ROOT, 'files', 'cryptoIcons');
export const UPDATED_ICONS_LIST_FILE = join(FILES_CRYPTOICONS_PATH, 'icons.json');
export const UPDATED_ICONS_LIST_URL = join(ICONS_URL_BASE, 'icons.json');

export const COIN_LIST_URL = 'https://pro-api.coingecko.com/api/v3/coins/list';
export const COIN_DATA_URL = 'https://pro-api.coingecko.com/api/v3/coins/';

export const RATE_LIMIT_PER_MINUTE = 240;
export const RUN_LIMIT_SECONDS = 4 * 60 * 60; // 4 hour
