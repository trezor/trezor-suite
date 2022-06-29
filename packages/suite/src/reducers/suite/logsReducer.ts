import produce from 'immer';

import { LOGS } from '@suite-actions/constants';
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
    entries: LogEntry[];
}

export const initialState: State = {
    entries: [],
};

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
            case LOG.ADD:
                // idk what is going on with this type. WTF related to ActionLogEntry
                // draft.entries should have correct State type, but it doesn't
                // it behave like this since i've added new optional field (features) to `config/wallet/networks.ts`
                addToStack(draft.entries as LogEntry[], action.payload);
                break;
            // no default
        }
    });
export default logsReducer;
