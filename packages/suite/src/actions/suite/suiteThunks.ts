import { type GotoThunkDeps, type GotoThunkState, gotoThunk } from '@suite/router';
import { type WithServices, createThunk } from '@suite-common/redux-utils';
import { type ReloadAppDep } from '@suite-common/suite-types';
import { type DesktopApiDep } from '@trezor/suite-desktop-api';

import { type DbDep } from 'src/storage/createDb';

import { removeDatabaseThunk } from './storageActions';

type ResetSuiteAppThunkState = GotoThunkState;

type ResetSuiteAppThunkDeps = GotoThunkDeps &
    WithServices<ReloadAppDep & DbDep & DesktopApiDep<'available' | 'clearStore' | 'appAutoStart'>>;

export const resetSuiteAppThunk = createThunk<
    void,
    void,
    { state: ResetSuiteAppThunkState; extra: ResetSuiteAppThunkDeps }
>('@suite/reset-app', async (_, { dispatch, extra }) => {
    localStorage.clear();
    dispatch(removeDatabaseThunk());

    if (extra.services.desktopApi.available) {
        // Reset the desktop-specific store.
        extra.services.desktopApi.clearStore();
        extra.services.desktopApi.appAutoStart(false);
    } else {
        // redirect to / and reload the web
        await dispatch(gotoThunk({ routeName: 'suite-index' }));
    }

    extra.services.reloadApp();
});
