import produce from 'immer';
import { LOG } from '@suite-actions/constants';

import { Action } from '@suite-types';

export interface LogEntry {
    time: number;
    type: string;
    message?: any;
}

export interface State {
    entries: LogEntry[];
}

export const initialState: State = {
    entries: [],
};

const MAX_ENTRIES = 200;

const addToStack = (stack: LogEntry[], entry: LogEntry) => {
    stack.push(entry);
    if (stack.length > MAX_ENTRIES) {
        stack.pop();
    }
};

export default (state: State = initialState, action: Action): State => {
    return produce(state, draft => {
        switch (action.type) {
            case LOG.ADD:
                addToStack(draft.entries, action.payload);
                break;
            // no default
        }
    });
};
