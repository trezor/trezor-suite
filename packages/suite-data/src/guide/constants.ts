import { resolve, join } from 'path';

export const GITBOOK_SOURCE = 'https://github.com/trezor/trezor-suite-guide.git';
export const GITBOOK_REVISION = 'f4af9a0b24f4a8ef8768d61c8dd2f4ad9a817d1e';
export const TMP = join(resolve(__dirname, '../..'), 'tmp', 'guide');
// Path to the GitBook assets. Relative to TMP.
export const ASSETS_DIR = join('.gitbook', 'assets');
export const DESTINATION = join(resolve(__dirname, '../..'), 'files', 'guide');
