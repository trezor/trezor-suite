import { createThunk } from '@suite-common/redux-utils';

import { LOCAL_FIRST_STORAGE_PREFIX } from './constants';

/**
 * This is hack, to make allow to dispatch extra.thunk in the React Hook.
 *
 * Todo: get rid of this hack
 */
export const initSuiteSyncHackForHook = createThunk<void, void, void>(
    `${LOCAL_FIRST_STORAGE_PREFIX}/initSuiteSyncHackForHook`,
    (_, { dispatch, extra }) => {
        dispatch(extra.thunks.initSuiteSync());
    },
);
