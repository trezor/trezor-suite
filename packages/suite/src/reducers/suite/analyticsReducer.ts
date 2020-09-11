import produce from 'immer';
import { ANALYTICS, STORAGE } from '@suite-actions/constants';
import { getAnalyticsRandomId } from '@suite-utils/random';

import { Action } from '@suite-types';

export interface State {
    sessionId?: string;
    instanceId?: string;
    enabled: boolean;
}

export const initialState: State = {
    // sessionId is generated only on app start, either added to storage-loaded action or taken from initial state
    sessionId: getAnalyticsRandomId(),
    instanceId: undefined,
    enabled: false,
};

const analyticsReducer = (state: State = initialState, action: Action): State => {
    return produce(state, draft => {
        switch (action.type) {
            case ANALYTICS.INIT:
                draft.enabled = true;
                draft.instanceId = action.payload.instanceId;
                break;
            case ANALYTICS.DISPOSE:
                draft.enabled = false;
                // - instanceId is persistent and will not be removed on dispose. once user re-enables
                // analytics, it will continue using previously generated instanceId
                // - sessionId is semi-persistent, lives in memory
                break;
            case STORAGE.LOADED:
                return action.payload.analytics;
            // no default
        }
    });
};

export default analyticsReducer;
