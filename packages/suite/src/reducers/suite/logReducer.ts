import produce from 'immer';
import { LOG } from '@suite-actions/constants';

import { Action } from '@suite-types';

export interface LogEntry {
    time: number;
    type: string;
    message?: any;
}

export interface State {
    excludeBalanceRelated: boolean;
    entries: LogEntry[];
}

export const initialState: State = {
    excludeBalanceRelated: false,
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
            case LOG.TOGGLE_EXCLUDE_BALANCE_RELATED:
                draft.excludeBalanceRelated = !draft.excludeBalanceRelated;
                break;
            // no default
        }
    });
};
