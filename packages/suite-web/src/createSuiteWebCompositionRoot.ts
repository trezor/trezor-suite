import { createBrowserHistory } from 'history';

import { SuiteSyncStorageFlusher } from '@suite-common/suite-sync-types';

import { initStore } from 'src/reducers/store';
import { PreloadStoreAction } from 'src/support/suite/preloadStore';

export const createSuiteWebCompositionRoot = (preloadStoreAction?: PreloadStoreAction) => {
    const history = createBrowserHistory();
    const flushSuiteSyncStorage: SuiteSyncStorageFlusher = () => {
        window.location.reload();
    };

    return initStore({ history, flushSuiteSyncStorage }, preloadStoreAction);
};
