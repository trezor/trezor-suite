import { resolve, join } from 'path';

export const GITBOOK_SOURCE = 'https://github.com/trezor/trezor-suite-guide.git';
export const GITBOOK_REVISION = '7cc4ae126002d30dc247f95073d37baa4ff297c4';
export const TMP = join(resolve(__dirname, '../..'), 'tmp', 'guide');
// Path to the GitBook assets. Relative to TMP.
export const ASSETS_DIR = join('.gitbook', 'assets');
export const DESTINATION = join(resolve(__dirname, '../..'), 'files', 'guide');
