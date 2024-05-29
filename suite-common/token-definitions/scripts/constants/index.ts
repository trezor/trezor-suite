import { join, resolve } from 'path';

import { VERSION } from '../../src/tokenDefinitionsConstants';

export const PACKAGE_ROOT = resolve(__dirname, '..', '..');

export const SCHEMA_FILENAME_SUFFIX = `schema.v${VERSION}.json`;
export const DEFINITIONS_FILENAME_SUFFIX = `definitions.v${VERSION}`;

export const SCHEMA_PATH = join(PACKAGE_ROOT, 'schema');
export const FILES_PATH = join(PACKAGE_ROOT, 'files');

export const NFT_LIST_URL = 'https://pro-api.coingecko.com/api/v3/nfts/list';
export const COIN_LIST_URL = 'https://pro-api.coingecko.com/api/v3/coins/list';

export const NFTS_PER_PAGE = 250;
