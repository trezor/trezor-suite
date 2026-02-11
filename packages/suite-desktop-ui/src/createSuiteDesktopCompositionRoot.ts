import { createMemoryHistory } from 'history';

import { desktopApi } from '@trezor/suite-desktop-api';

import { initStore } from 'src/reducers/store';
import type { DbDep } from 'src/storage';
import { PreloadStoreAction } from 'src/support/suite/preloadStore';

type CreateSuiteDesktopCompositionRootDeps = {
    preloadStoreAction?: PreloadStoreAction;
} & DbDep;

export const createSuiteDesktopCompositionRoot = (
    deps: CreateSuiteDesktopCompositionRootDeps,
    statePatch?: Record<string, any>,
) => {
    const history = createMemoryHistory();
    const reloadApp = () => {
        desktopApi.reloadBrowserWindow();
    };

    return initStore({ history, reloadApp, db: deps.db }, deps.preloadStoreAction, {
        statePatch,
    });
};
