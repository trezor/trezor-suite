import { createBrowserHistory } from 'history';

import { createWebauthnPlatformEncryption } from '@suite/platform-encryption-webauthn';
import { createNetworkAvailability } from '@suite-common/wallet-config';

import { initStore } from 'src/reducers/store';
import { createConnectLoggerFactory } from 'src/support/createConnectLoggerFactory';
import { type PreloadStoreAction } from 'src/support/suite/preloadStore';

import { getWebThpHostName } from './support/getWebThpHostName';

export const createSuiteWebCompositionRoot = (preloadStoreAction?: PreloadStoreAction) => {
    const history = createBrowserHistory();
    const platformEncryption = createWebauthnPlatformEncryption();
    const reloadApp = () => window.location.reload();
    // Web excludes desktop-only networks (e.g. Monero, which needs a locally-managed node).
    const networkAvailability = createNetworkAvailability({ allowDesktopOnlyNetworks: false });

    return initStore(
        {
            history,
            platformEncryption,
            createConnectLoggerFactory,
            reloadApp,
            thpHostName: getWebThpHostName(),
            networkAvailability,
        },
        preloadStoreAction,
    );
};
