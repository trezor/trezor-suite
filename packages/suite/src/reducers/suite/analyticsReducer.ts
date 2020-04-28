import produce from 'immer';
import { ANALYTICS, STORAGE } from '@suite-actions/constants';

import { Action } from '@suite-types';

export interface State {
    sessionId?: string;
    instanceId?: string;
    enabled: boolean;
}

export const initialState: State = {
    sessionId: undefined,
    instanceId: undefined,
    enabled: false,
};

export default (state: State = initialState, action: Action): State => {
    return produce(state, draft => {
        switch (action.type) {
            case ANALYTICS.INIT:
                draft.enabled = true;
                draft.sessionId = action.payload.sessionId;
                draft.instanceId = action.payload.instanceId;
                break;
            case ANALYTICS.DISPOSE:
                draft.enabled = false;
                draft.sessionId = undefined;
                draft.instanceId = undefined;
                break;
            case STORAGE.LOADED:
                return action.payload.analytics;
            // no default
        }
    });
};
