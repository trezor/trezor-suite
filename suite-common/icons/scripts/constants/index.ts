import { join, resolve } from 'path';

import { ICONS_URL_BASE } from '../../src/coinImages';

export const PACKAGE_ROOT = resolve(__dirname, '..', '..');

export const FILES_CRYPTOICONS_PATH = join(PACKAGE_ROOT, 'files', 'cryptoIcons');
// Bundled coin discs the apps render for native coins, keyed by network symbol. Read directly
// instead of through `src/cryptoIcons`, whose `require` calls only resolve in a bundler.
export const CRYPTO_ICONS_SVG_PATH = join(PACKAGE_ROOT, 'cryptoAssets', 'cryptoIcons');
export const UPDATED_ICONS_LIST_FILE = join(FILES_CRYPTOICONS_PATH, 'icons.json');
export const UPDATED_ICONS_LIST_URL = join(ICONS_URL_BASE, 'icons.json');

const COINGECKO_MODE: string = 'pro' satisfies 'pro' | 'demo';

export const COINGECKO_API_BASE_URL =
    COINGECKO_MODE === 'pro'
        ? 'https://pro-api.coingecko.com/api/v3'
        : 'https://api.coingecko.com/api/v3';

export const COINGECKO_API_KEY_HEADER =
    COINGECKO_MODE === 'pro' ? 'x-cg-pro-api-key' : 'x-cg-demo-api-key';

export const COINGECKO_API_KEY_VALUE = process.env.COINGECKO_API_KEY;

export const RATE_LIMIT_PER_MINUTE = 240;
export const RUN_LIMIT_SECONDS = 4 * 60 * 60; // 4 hour

// The earn-yield worker is the source of truth for yield vaults; it serves all vault addresses
// across environments. Kept in sync with suite-common/token-definitions, which consumes the same
// endpoint to publish the vault addresses as known tokens.
export const YIELD_VAULTS_URL = 'https://earn.trezor.io/yield/vaults/v1';

// /coins/markets returns image URLs in bulk (max 250 per page), letting us avoid one
// /coins/{id} call per coin (~72 pages cover the ~18k coins with market data).
export const COIN_MARKETS_PER_PAGE = 250;
