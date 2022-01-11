import { resolve, join } from 'path';

export const GITBOOK_SOURCE = 'https://github.com/trezor/trezor-suite-guide.git';
export const GITBOOK_REVISION = 'ffb6ff212e515e20a65fefc2b21d4475dec6bbe0';
export const TMP = join(resolve(__dirname, '../..'), 'tmp', 'guide');
// Path to the GitBook assets. Relative to TMP.
export const ASSETS_DIR = join('.gitbook', 'assets');
export const DESTINATION = join(resolve(__dirname, '../..'), 'files', 'guide');
