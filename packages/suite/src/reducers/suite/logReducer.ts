import produce from 'immer';
import { LOG } from '@suite-actions/constants';

import { Action } from '@suite-types';

export type ActionLogEntry = {
    time: number;
    custom: false;
    action: Action;
};

export type CustomLogEntry = {
    time: number;
    custom: true;
    action: {
        type: Action['type'];
        payload?: Record<any, any> | undefined;
    };
};

export type LogEntry = ActionLogEntry | CustomLogEntry;

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

const logReducer = (state: State = initialState, action: Action): State => {
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

export default logReducer;
