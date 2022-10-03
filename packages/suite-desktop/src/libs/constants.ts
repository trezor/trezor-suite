import url from 'url';

import { TOR_URLS } from '@trezor/urls';
import { isDevEnv } from '@suite-common/suite-utils';

export const APP_NAME = 'Trezor Suite';

export const FILE_PROTOCOL = 'file';

export const APP_SRC = isDevEnv
    ? 'http://localhost:8000/'
    : url.format({
          pathname: 'index.html',
          protocol: FILE_PROTOCOL,
          slashes: true,
      });

// HTTP server default origins
export const HTTP_ORIGINS_DEFAULT = [
    '127.0.0.1',
    'localhost',
    'trezor.io',
    '*.trezor.io',
    '*.sldev.cz',
    TOR_URLS['trezor.io'],
    `*.${TOR_URLS['trezor.io']}`,
];
