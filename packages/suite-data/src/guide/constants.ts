import { resolve, join } from 'path';

export const GITBOOK_SOURCE = 'https://github.com/trezor/trezor-suite-guide.git';
export const GITBOOK_REVISION = '867eda00926bc065c3ec7eaee26832d08549ecfe';
export const TMP = join(resolve(__dirname, '../..'), 'tmp', 'guide');
