import { join, resolve } from 'path';

export const PACKAGE_ROOT = resolve(__dirname, '..'); // suite-common/release-notes

export const OUTPUT_DIR = join(PACKAGE_ROOT, 'files');
