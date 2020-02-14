import produce from 'immer';
import { LOG } from '@suite-actions/constants';

import { Action } from '@suite-types';

export interface LogEntry {
    time: number;
    type: string;
    message: any;
}

export interface State {
    entries: LogEntry[];
}

export const initialState: State = {
    entries: [],
};

export default (state: State = initialState, action: Action): State => {
    return produce(state, draft => {
        switch (action.type) {
            case LOG.ADD:
                draft.entries = state.entries.concat([action.payload]);
                break;
            // no default
        }
    });
};
