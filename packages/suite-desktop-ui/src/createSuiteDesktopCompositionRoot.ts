import { createMemoryHistory } from 'history';

import { createElectronPlatformEncryption } from '@suite/platform-encryption-electron';
import { createNetworkAvailability } from '@suite-common/wallet-config';
import { desktopApi } from '@trezor/suite-desktop-api';

import { initStore } from 'src/reducers/store';
import { type PreloadStoreAction } from 'src/support/suite/preloadStore';

export const createSuiteDesktopCompositionRoot = (
    preloadStoreAction?: PreloadStoreAction,
    statePatch?: Record<string, any>,
) => {
    const history = createMemoryHistory();
    const platformEncryption = createElectronPlatformEncryption({ desktopApi });
    // Desktop is the only build that ships desktop-only networks (e.g. Monero's locally-managed node).
    const networkAvailability = createNetworkAvailability({ allowDesktopOnlyNetworks: true });

    return initStore(
        { history, platformEncryption, createConnectLoggerFactory: undefined, networkAvailability },
        preloadStoreAction,
        { statePatch },
    );
};
