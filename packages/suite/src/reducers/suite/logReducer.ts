import produce from 'immer';
import { LOG } from '@suite-actions/constants';

import { Action } from '@suite-types/index';

export interface LogEntry {
    time: number;
    type: string;
    message: any;
}

export interface State {
    opened: boolean;
    entries: LogEntry[];
    copied: boolean;
}

export const initialState: State = {
    opened: false,
    entries: [],
    copied: false,
};

export default (state: State = initialState, action: Action): State => {
    return produce(state, draft => {
        switch (action.type) {
            case LOG.OPEN:
                draft.opened = true;
                break;

            case LOG.ADD:
                draft.entries = state.entries.concat([action.payload]);
                break;

            case LOG.CLOSE:
                draft.copied = true;
                draft.opened = true;
                break;

            case LOG.COPY_SUCCESS:
                draft.copied = true;
                break;

            case LOG.COPY_RESET:
                draft.copied = false;
                break;

            default:
                return state;
        }
    });
};
