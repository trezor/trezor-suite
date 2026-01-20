import { createBrowserHistory } from 'history';

import { StorageFlusher } from '@suite-common/suite-sync-types';

import { initStore } from 'src/reducers/store';
import { PreloadStoreAction } from 'src/support/suite/preloadStore';

export const createSuiteWebCompositionRoot = (preloadStoreAction?: PreloadStoreAction) => {
    const history = createBrowserHistory();
    const flushSuiteSyncStorage: StorageFlusher = () => {
        window.location.reload();
    };

    return initStore({ history, flushSuiteSyncStorage }, preloadStoreAction);
};
