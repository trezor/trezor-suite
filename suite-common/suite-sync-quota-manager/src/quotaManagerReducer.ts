import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { isDevEnv } from '@suite-common/suite-utils';

import { updateQuotaManagerBaseUrl } from './quotaManagerActions';

export type SuiteSyncQuotaManagerState = {
    baseUrl: string; // with default value depending on the envinronment
    quotaLeft: number;

    // TODO registered devices

    // Temporary session data
    sessionId: string | null;
    challenge: string | null;
};

export const initialState: SuiteSyncQuotaManagerState = {
    baseUrl: isDevEnv ? 'http://127.0.0.1:4001' : 'TODO',
    quotaLeft: 500000, // figure out default quota
    sessionId: null,
    challenge: null,
};

export const prepareSuiteSyncQuotaManagerReducer =
    createReducerWithExtraDeps<SuiteSyncQuotaManagerState>(initialState, builder =>
        builder.addCase(updateQuotaManagerBaseUrl, (state, { payload }) => {
            state.baseUrl = payload.baseUrl;
        }),
    );
