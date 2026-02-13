import { createBrowserHistory } from 'history';

import { initStore } from 'src/reducers/store';
import { type PreloadStoreAction } from 'src/support/suite/preloadStore';

export const createSuiteWebCompositionRoot = (preloadStoreAction?: PreloadStoreAction) => {
    const history = createBrowserHistory();

    return initStore({ history }, preloadStoreAction);
};
