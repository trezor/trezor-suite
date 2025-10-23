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
