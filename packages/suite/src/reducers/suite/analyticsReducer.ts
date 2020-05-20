import produce from 'immer';
import { ANALYTICS, STORAGE } from '@suite-actions/constants';
import { getRandomId } from '@suite-utils/random';

import { Action } from '@suite-types';

export interface State {
    sessionId?: string;
    instanceId?: string;
    enabled: boolean;
}

export const initialState: State = {
    sessionId: getRandomId(10),
    instanceId: undefined,
    enabled: false,
};

export default (state: State = initialState, action: Action): State => {
    return produce(state, draft => {
        switch (action.type) {
            case ANALYTICS.INIT:
                draft.enabled = true;
                draft.instanceId = action.payload.instanceId;
                break;
            case ANALYTICS.DISPOSE:
                draft.enabled = false;
                draft.sessionId = undefined;
                // instanceId is persistent and will not be removed on dispose. once user re-enables
                // analytics, it will continue using previously generated instanceId
                break;
            case STORAGE.LOADED:
                return action.payload.analytics;
            // no default
        }
    });
};
