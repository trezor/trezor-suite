/* @flow */
'use strict';

import * as LOG from '../actions/constants/log';
import type { Action } from '../flowtype';

type LogEntry = {
    time: number;
    type: string;
    messgage: string;
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
                opened: true
            }

        case LOG.CLOSE: 
            return {
                ...state,
                opened: false
            }

        // case 'log__add': 
        //     return {
        //         ...state,
        //     }

        default:
            return state;
    }

}