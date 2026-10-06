import { createSliceWithExtraDeps } from '@suite-common/redux-utils';
import {
    quotaManagerInitialState,
    suiteSyncQuotaManagerReducer,
} from '@suite-common/suite-sync-quota-manager';

import { storageLoad } from '../suite/storageLifecycleActions';

export const suiteSyncQuotaManagerSlice = createSliceWithExtraDeps({
    name: 'suiteSyncQuotaManager',
    initialState: quotaManagerInitialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(storageLoad, (state, action) => {
                if (action.payload.suiteSyncQuotaManager) {
                    return {
                        ...state,
                        ...action.payload.suiteSyncQuotaManager,
                    };
                }
            })
            .addDefaultCase((state, action) => {
                suiteSyncQuotaManagerReducer(state, action);
            });
    },
});
