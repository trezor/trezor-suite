import { resolve, join } from 'path';

export const GITBOOK_SOURCE = 'https://github.com/trezor/trezor-suite-guide.git';
export const GITBOOK_REVISION = '067fc85ea90ef29303c4e8c948fde1f1708929fa';
export const TMP = join(resolve(__dirname, '../..'), 'tmp', 'guide');
// Path to the GitBook assets. Relative to TMP.
export const ASSETS_DIR = join('.gitbook', 'assets');
export const DESTINATION = join(resolve(__dirname, '../..'), 'files', 'guide');
