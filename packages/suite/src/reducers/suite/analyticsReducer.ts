import produce from 'immer';
import { ANALYTICS } from '@suite-actions/constants';

import { Action } from '@suite-types';

export interface AnalyticsState {
    sessionId?: string;
    instanceId?: string;
    enabled?: boolean;
    confirmed?: boolean; // Has the user confirmed the choice for analytics?
}

export const initialState: AnalyticsState = {
    sessionId: undefined,
    instanceId: undefined,
    enabled: undefined,
    confirmed: false,
};

const analyticsReducer = (state: AnalyticsState = initialState, action: Action): AnalyticsState =>
    produce(state, draft => {
        switch (action.type) {
            // NOTE: storage loaded was not used here before?
            // case 'STO':
            //     return action.payload?.analytics || state;
            case ANALYTICS.INIT:
                draft.enabled = action.payload.enabled;
                draft.confirmed = action.payload.confirmed;
                draft.instanceId = action.payload.instanceId;
                draft.sessionId = action.payload.sessionId;
                break;
            case ANALYTICS.ENABLE:
                draft.enabled = true;
                draft.confirmed = true;
                break;
            case ANALYTICS.DISABLE:
                draft.enabled = false;
                draft.confirmed = true;
                break;
            // no default
        }
    });

export default analyticsReducer;
