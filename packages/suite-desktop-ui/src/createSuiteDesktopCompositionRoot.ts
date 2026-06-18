import { createMemoryHistory } from 'history';

import { createElectronPlatformEncryption } from '@suite/platform-encryption-electron';
import { desktopApi } from '@trezor/suite-desktop-api';

import { initStore } from 'src/reducers/store';
import { type PreloadStoreAction } from 'src/support/suite/preloadStore';

export const createSuiteDesktopCompositionRoot = (
    preloadStoreAction?: PreloadStoreAction,
    statePatch?: Record<string, any>,
) => {
    const history = createMemoryHistory();
    const platformEncryption = createElectronPlatformEncryption({ desktopApi });

    return initStore(
        { history, platformEncryption, createConnectLoggerFactory: undefined },
        preloadStoreAction,
        { statePatch },
    );
};
