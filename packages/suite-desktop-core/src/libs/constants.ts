import url from 'url';

import { isDevEnv } from '@suite-common/suite-utils';
import { TOR_URLS } from '@trezor/urls';
import { isCodesignBuild } from '@trezor/env-utils';

const getAppName = () => {
    const appName = 'Trezor Suite';

    if (!isCodesignBuild()) {
        return `${appName} ${isDevEnv ? 'Local' : 'Dev'}`;
    }

    return appName;
};

export const APP_NAME = getAppName();

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
