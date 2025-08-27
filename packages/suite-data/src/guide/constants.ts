import { join, resolve } from 'path';

export const GITBOOK_SOURCE = 'https://github.com/trezor/trezor-suite-guide.git';
export const GITBOOK_REVISION = '8c9e57a9b0e478b6ccf5b47c532a5abef3dbfd89';
export const TMP = join(resolve(__dirname, '../..'), 'tmp', 'guide');
// Path to the GitBook assets. Relative to TMP.
export const GITBOOK_ASSETS_DIR_PREFIX = '.gitbook';
export const GITBOOK_ASSETS_DIR = 'assets';
export const ASSETS_DIR_SOURCE = join(GITBOOK_ASSETS_DIR_PREFIX, GITBOOK_ASSETS_DIR);
export const ASSETS_DIR_DESTINATION = join(GITBOOK_ASSETS_DIR);
export const DESTINATION = join(resolve(__dirname, '../..'), 'files', 'guide');
