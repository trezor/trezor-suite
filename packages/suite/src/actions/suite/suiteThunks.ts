import { goto } from '@suite/router';
import { createThunk } from '@suite-common/redux-utils';
import { desktopApi } from '@trezor/suite-desktop-api';

import { removeDatabase } from './storageActions';

export const resetSuiteAppThunk = createThunk(
    '@suite/reset-app',
    async (_, { dispatch, extra }) => {
        localStorage.clear();
        dispatch(removeDatabase());

        if (desktopApi.available) {
            // Reset the desktop-specific store.
            desktopApi.clearStore();
            desktopApi.appAutoStart(false);
        } else {
            // redirect to / and reload the web
            await dispatch(goto({ routeName: 'suite-index' }));
        }

        extra.services.reloadApp();
    },
);
