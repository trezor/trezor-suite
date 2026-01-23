import { createMemoryHistory } from 'history';

import { desktopApi } from '@trezor/suite-desktop-api';

import { initStore } from 'src/reducers/store';
import { PreloadStoreAction } from 'src/support/suite/preloadStore';

export const createSuiteDesktopCompositionRoot = (
    preloadStoreAction?: PreloadStoreAction,
    statePatch?: Record<string, any>,
) => {
    const history = createMemoryHistory();
    const flushSuiteSyncStorage = () => {
        desktopApi.reloadBrowserWindow();
    };

    return initStore({ history, flushSuiteSyncStorage }, preloadStoreAction, { statePatch });
};
