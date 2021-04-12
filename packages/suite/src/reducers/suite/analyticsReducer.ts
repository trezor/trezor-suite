import produce from 'immer';
import { ANALYTICS } from '@suite-actions/constants';

import { Action } from '@suite-types';

export interface State {
    sessionId?: string;
    instanceId?: string;
    enabled?: boolean;
    sessionStart?: number;
}

export const initialState: State = {
    sessionId: undefined,
    instanceId: undefined,
    enabled: undefined,
    sessionStart: undefined,
};

const analyticsReducer = (state: State = initialState, action: Action): State =>
    produce(state, draft => {
        switch (action.type) {
            case ANALYTICS.INIT:
                draft.enabled = action.payload.enabled;
                draft.instanceId = action.payload.instanceId;
                draft.sessionId = action.payload.sessionId;
                draft.sessionStart = action.payload.sessionStart;
                break;
            case ANALYTICS.ENABLE:
                draft.enabled = true;
                break;
            case ANALYTICS.DISPOSE:
                draft.enabled = false;
                break;
            // no default
        }
    });

export default analyticsReducer;
