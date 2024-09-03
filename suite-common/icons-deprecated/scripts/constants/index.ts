import { join, resolve } from 'path';

export const PACKAGE_ROOT = resolve(__dirname, '..', '..');

export const FILES_CRYPTOICONS_PATH = join(PACKAGE_ROOT, 'files', 'cryptoIcons');
export const UPDATED_ICONS_LIST_FILE = join(FILES_CRYPTOICONS_PATH, 'icons.json');
export const UPDATED_ICONS_LIST_URL = 'https://data.trezor.io/suite/icons/coins/icons.json';

export const COIN_LIST_URL = 'https://pro-api.coingecko.com/api/v3/coins/list';
export const COIN_DATA_URL = 'https://pro-api.coingecko.com/api/v3/coins/';

export const RATE_LIMIT_PER_MINUTE = 60;
export const RUN_LIMIT_SECONDS = 60 * 60; // 1 hour

export const COIN_IMAGE_SIZES = {
    '1x': 24,
    '2x': 48,
};
