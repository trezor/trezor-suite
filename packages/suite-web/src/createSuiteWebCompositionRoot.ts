import { createBrowserHistory } from 'history';

import { initStore } from 'src/reducers/store';
import type { DbDep } from 'src/storage';
import { PreloadStoreAction } from 'src/support/suite/preloadStore';

type CreateSuiteWebCompositionRootDeps = {
    preloadStoreAction?: PreloadStoreAction;
} & DbDep;

export const createSuiteWebCompositionRoot = (deps: CreateSuiteWebCompositionRootDeps) => {
    const history = createBrowserHistory();
    const reloadApp = () => {
        window.location.reload();
    };

    return initStore({ history, reloadApp, db: deps.db }, deps.preloadStoreAction);
};
