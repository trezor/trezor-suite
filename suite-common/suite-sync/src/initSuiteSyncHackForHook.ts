import { createThunk } from '@suite-common/redux-utils';

import { SUITE_SYNC_STORAGE_PREFIX } from './constants';

/**
 * This is hack, to make allow to dispatch extra.thunk in the React Hook.
 *
 * Todo: get rid of this hack
 */
export const initSuiteSyncHackForHook = createThunk<void, void, void>(
    `${SUITE_SYNC_STORAGE_PREFIX}/initSuiteSyncHackForHook`,
    (_, { dispatch, extra }) => {
        dispatch(extra.thunks.initSuiteSync());
    },
);
