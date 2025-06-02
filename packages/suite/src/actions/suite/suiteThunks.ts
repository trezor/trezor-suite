import { createThunk } from '@suite-common/redux-utils';
import { desktopApi } from '@trezor/suite-desktop-api';

import { goto } from 'src/actions/suite/routerActions';
import { reloadApp } from 'src/utils/suite/reload';

import { removeDatabase } from './storageActions';

export const resetSuiteAppThunk = createThunk('@suite/reset-app', async (_, { dispatch }) => {
    localStorage.clear();
    dispatch(removeDatabase());
    if (desktopApi.available) {
        // Reset the desktop-specific store.
        desktopApi.clearStore();
        desktopApi.appAutoStart(false);
    } else {
        // redirect to / and reload the web
        await dispatch(goto('suite-index'));
    }
    reloadApp();
});
