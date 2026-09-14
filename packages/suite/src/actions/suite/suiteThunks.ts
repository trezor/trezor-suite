import { type GotoThunkDeps, type GotoThunkState, gotoThunk } from '@suite/router';
import { type NetworksRootState, selectNetworkConfigAccessors } from '@suite-common/networks';
import { createThunk } from '@suite-common/redux-utils';
import { type ReloadAppDep } from '@suite-common/suite-types';
import { desktopApi } from '@trezor/suite-desktop-api';

import { removeDatabaseThunk } from './storageActions';

type ResetSuiteAppThunkState = GotoThunkState & NetworksRootState;

type ResetSuiteAppThunkDeps = GotoThunkDeps & {
    services: ReloadAppDep;
};

export const resetSuiteAppThunk = createThunk<
    void,
    void,
    { state: ResetSuiteAppThunkState; extra: ResetSuiteAppThunkDeps }
>('@suite/reset-app', async (_, { getState, dispatch, extra }) => {
    const networkConfigDeps = selectNetworkConfigAccessors(getState());

    localStorage.clear();
    dispatch(removeDatabaseThunk(networkConfigDeps));

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
