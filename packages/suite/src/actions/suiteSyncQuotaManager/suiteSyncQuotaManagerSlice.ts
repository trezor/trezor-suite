import { type AnyAction, createSliceWithExtraDeps } from '@suite-common/redux-utils';
import {
    quotaManagerInitialState,
    suiteSyncQuotaManagerReducer,
} from '@suite-common/suite-sync-quota-manager';

import { STORAGE } from '../suite/constants';

export const suiteSyncQuotaManagerSlice = createSliceWithExtraDeps({
    name: 'suiteSyncQuotaManager',
    initialState: quotaManagerInitialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(STORAGE.LOAD, (state, action) => {
                const actionWithPayload = action as AnyAction;

                if (
                    actionWithPayload.type === STORAGE.LOAD &&
                    actionWithPayload.payload.suiteSyncQuotaManager
                ) {
                    return {
                        ...state,
                        ...actionWithPayload.payload.suiteSyncQuotaManager,
                    };
                }
            })
            .addDefaultCase((state, action) => {
                suiteSyncQuotaManagerReducer(state, action as AnyAction);
            });
    },
});
