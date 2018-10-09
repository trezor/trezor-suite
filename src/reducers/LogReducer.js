/* @flow */

import * as LOG from 'actions/constants/log';
import type { Action } from 'flowtype';

export type LogEntry = {
    time: number;
    type: string;
    message: any;
}

export type State = {
    opened: boolean;
    entries: Array<LogEntry>;
}

export const initialState: State = {
    opened: false,
    entries: [],
};


export default (state: State = initialState, action: Action): State => {
    switch (action.type) {
        case LOG.OPEN:
            return {
                ...state,
                opened: true,
            };

        case LOG.CLOSE:
            return {
                ...state,
                opened: false,
            };

        case LOG.ADD:
            return {
                ...state,
                entries: state.entries.concat([action.payload]),
            };

        default:
            return state;
    }
};