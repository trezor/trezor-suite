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
    copied: boolean
}

export const initialState: State = {
    opened: false,
    entries: [],
    copied: false,
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
                copied: false,
            };

        case LOG.ADD:
            return {
                ...state,
                entries: state.entries.concat([action.payload]),
            };

        case LOG.COPY_SUCCESS:
            return {
                ...state,
                copied: true,
            };

        case LOG.COPY_RESET:
            return {
                ...state,
                copied: false,
            };

        default:
            return state;
    }
};