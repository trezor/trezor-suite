import { type DesktopApiDep } from '@suite/desktop-app-api';
import { type GotoThunkDeps, type GotoThunkState, gotoThunk } from '@suite/router';
import { type EnsureTransactionStoreDep } from '@suite/transaction-store';
import { type ReloadAppDep } from '@suite-common/suite-types';
import { type WithServices, createThunk } from '@trezor/redux-utils';

import { type DbDep } from 'src/storage/createDb';

import { removeDatabaseThunk } from './storageActions';

type ResetSuiteAppThunkState = GotoThunkState;

type ResetSuiteAppThunkDeps = GotoThunkDeps &
    WithServices<
        ReloadAppDep &
            DbDep &
            EnsureTransactionStoreDep &
            DesktopApiDep<'available' | 'clearStore' | 'appAutoStart'>
    >;

export const resetSuiteAppThunk = createThunk<
    void,
    void,
    { state: ResetSuiteAppThunkState; extra: ResetSuiteAppThunkDeps }
>('@suite/reset-app', async (_, { dispatch, extra }) => {
    localStorage.clear();
    dispatch(removeDatabaseThunk());
    // The transaction store's history, in its own database; a failure must not stop the reset.
    await extra.services
        .ensureTransactionStore()
        .deleteDatabase()
        .catch(() => {});

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
