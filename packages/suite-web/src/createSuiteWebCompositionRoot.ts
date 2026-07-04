import { createBrowserHistory } from 'history';

import { createWebauthnPlatformEncryption } from '@suite/platform-encryption-webauthn';

import { initStore } from 'src/reducers/store';
import { createConnectLoggerFactory } from 'src/support/createConnectLoggerFactory';
import { type PreloadStoreAction } from 'src/support/suite/preloadStore';

import { getWebThpHostName } from './support/getWebThpHostName';

export const createSuiteWebCompositionRoot = (preloadStoreAction?: PreloadStoreAction) => {
    const history = createBrowserHistory();
    const platformEncryption = createWebauthnPlatformEncryption();
    const reloadApp = () => window.location.reload();

    return initStore(
        {
            history,
            platformEncryption,
            createConnectLoggerFactory,
            reloadApp,
            thpHostName: getWebThpHostName(),
        },
        preloadStoreAction,
    );
};
