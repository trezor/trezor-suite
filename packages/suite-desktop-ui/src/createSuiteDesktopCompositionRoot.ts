import { createMemoryHistory } from 'history';

import { desktopApi } from '@trezor/suite-desktop-api';

import { initStore } from 'src/reducers/store';
import { type PreloadStoreAction } from 'src/support/suite/preloadStore';

export const createSuiteDesktopCompositionRoot = (
    preloadStoreAction?: PreloadStoreAction,
    statePatch?: Record<string, any>,
) => {
    const history = createMemoryHistory();
    const reloadApp = () => {
        desktopApi.reloadBrowserWindow();
    };

    return initStore({ history, reloadApp }, preloadStoreAction, {
        statePatch,
    });
};
