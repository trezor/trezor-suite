import { resolve, join } from 'path';

export const GITBOOK_SOURCE = 'https://github.com/trezor/trezor-suite-guide.git';
export const GITBOOK_REVISION = 'beb89c7131a2bea9e417fb77eb74cf3dda39f0b3';
export const TMP = join(resolve(__dirname, '../..'), 'tmp', 'guide');
// Path to the GitBook assets. Relative to TMP.
export const GITBOOK_ASSETS_DIR_PREFIX = '.gitbook';
export const GITBOOK_ASSETS_DIR = 'assets';
export const ASSETS_DIR_SOURCE = join(GITBOOK_ASSETS_DIR_PREFIX, GITBOOK_ASSETS_DIR);
export const ASSETS_DIR_DESTINATION = join(GITBOOK_ASSETS_DIR);
export const DESTINATION = join(resolve(__dirname, '../..'), 'files', 'guide');
