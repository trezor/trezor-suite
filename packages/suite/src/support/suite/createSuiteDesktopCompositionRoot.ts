import { createMemoryHistory } from 'history';

import { SuiteSyncStorageFlusher } from '@suite-common/suite-sync-types';
import { desktopApi } from '@trezor/suite-desktop-api';

import type { PreloadStoreAction } from './preloadStore';
import { initStore } from '../../reducers/store';

export const createSuiteDesktopCompositionRoot = (
    preloadStoreAction?: PreloadStoreAction,
    statePatch: Record<string, any> = {},
) => {
    const history = createMemoryHistory();
    const flushSuiteSyncStorage: SuiteSyncStorageFlusher = () => {
        desktopApi.reloadBrowserWindow();
    };

    return initStore({ history, flushSuiteSyncStorage }, preloadStoreAction, { statePatch });
};
