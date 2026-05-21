import { createBrowserHistory } from 'history';

import { createWebauthnPlatformEncryption } from '@suite/platform-encryption-webauthn';

import { initStore } from 'src/reducers/store';
import { type PreloadStoreAction } from 'src/support/suite/preloadStore';

export const createSuiteWebCompositionRoot = (preloadStoreAction?: PreloadStoreAction) => {
    const history = createBrowserHistory();
    const platformEncryption = createWebauthnPlatformEncryption();

    return initStore({ history, platformEncryption }, preloadStoreAction);
};
