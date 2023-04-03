import { resolve, join } from 'path';

export const GITBOOK_SOURCE = 'https://github.com/trezor/trezor-suite-guide.git';
export const GITBOOK_REVISION = 'cb339d12659cc03427f0499456e216fb89d022ec';
export const TMP = join(resolve(__dirname, '../..'), 'tmp', 'guide');
// Path to the GitBook assets. Relative to TMP.
export const GITBOOK_ASSETS_DIR_PREFIX = '.gitbook';
export const GITBOOK_ASSETS_DIR = 'assets';
export const ASSETS_DIR_SOURCE = join(GITBOOK_ASSETS_DIR_PREFIX, GITBOOK_ASSETS_DIR);
export const ASSETS_DIR_DESTINATION = join(GITBOOK_ASSETS_DIR);
export const DESTINATION = join(resolve(__dirname, '../..'), 'files', 'guide');
