import { goto } from '@suite/router';
import { createThunk } from '@suite-common/redux-utils';
import { selectDeleteSuiteSyncLocalDataDep } from '@suite-common/suite-sync-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { desktopApi } from '@trezor/suite-desktop-api';

import { reloadApp } from 'src/utils/suite/reload';

import { removeDatabase } from './storageActions';

export const resetSuiteAppThunk = createThunk<void, void, { rejectValue: string }>(
    '@suite/reset-app',
    async (_, { dispatch, extra, rejectWithValue }) => {
        const { deleteSuiteSyncLocalData } = selectDeleteSuiteSyncLocalDataDep(extra.services);

        const result = await deleteSuiteSyncLocalData();

        if (!result.success) {
            dispatch(notificationsActions.addToast({ type: 'error', error: result.error.message }));

            return rejectWithValue(result.error.message);
        }

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
        reloadApp();
    },
);
