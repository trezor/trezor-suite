import produce from 'immer';
import { ANALYTICS } from '@suite-actions/constants';

import { Action } from '@suite-types';

export interface State {
    sessionId?: string;
    instanceId?: string;
    enabled?: boolean;
}

export const initialState: State = {
    sessionId: undefined,
    instanceId: undefined,
    enabled: undefined,
};

const analyticsReducer = (state: State = initialState, action: Action): State => {
    return produce(state, draft => {
        switch (action.type) {
            case ANALYTICS.INIT:
                draft.enabled = action.payload.enabled;
                draft.instanceId = action.payload.instanceId;
                draft.sessionId = action.payload.sessionId;
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
};

export default analyticsReducer;
