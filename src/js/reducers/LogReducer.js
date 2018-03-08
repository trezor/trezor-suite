/* @flow */
'use strict';

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


export default (state: State = initialState, action: any): State => {

    switch (action.type) {

        case 'log__open': 
            return {
                ...state,
                opened: true
            }

        case 'log__close': 
            return {
                ...state,
                opened: false
            }

        case 'log__add': 
            return {
                ...state,
            }

        default:
            return state;
    }

}