import url from 'url';

import { isDevEnv } from '@suite-common/suite-utils';
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
