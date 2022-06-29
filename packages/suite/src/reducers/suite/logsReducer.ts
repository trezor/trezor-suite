import produce from 'immer';

import { LOGS } from '@suite-actions/constants';
import { Action } from '@suite-types';

export type LogEntry = { datetime: string; type: Action['type']; payload?: Record<any, any> };

export type State = LogEntry[];

export const initialState: State = [];

const MAX_ENTRIES = 200;

const addToStack = (stack: LogEntry[], entry: LogEntry) => {
    stack.push(entry);
    if (stack.length > MAX_ENTRIES) {
        stack.shift();
    }
};

const logsReducer = (state: State = initialState, action: Action): State =>
    produce(state, draft => {
        switch (action.type) {
            case LOGS.ADD:
                addToStack(draft, action.payload);
                break;
            // no default
        }
    });
export default logsReducer;
