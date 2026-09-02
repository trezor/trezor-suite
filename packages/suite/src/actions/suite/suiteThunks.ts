import { type GotoThunkDeps, type GotoThunkState, gotoThunk } from '@suite/router';
import { createThunk } from '@suite-common/redux-utils';
import { type ReloadAppDep } from '@suite-common/suite-types';
import { desktopApi } from '@trezor/suite-desktop-api';

import { removeDatabaseThunk } from './storageActions';

type ResetSuiteAppThunkState = GotoThunkState;

type ResetSuiteAppThunkDeps = GotoThunkDeps & {
    services: ReloadAppDep;
};

export const resetSuiteAppThunk = createThunk<
    void,
    void,
    { state: ResetSuiteAppThunkState; extra: ResetSuiteAppThunkDeps }
>('@suite/reset-app', async (_, { dispatch, extra }) => {
    localStorage.clear();
    dispatch(removeDatabaseThunk());

    if (desktopApi.available) {
        // Reset the desktop-specific store.
        desktopApi.clearStore();
        desktopApi.appAutoStart(false);
    } else {
        // redirect to / and reload the web
        await dispatch(gotoThunk({ routeName: 'suite-index' }));
    }

    extra.services.reloadApp();
});
