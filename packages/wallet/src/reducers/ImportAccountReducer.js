/* @flow */

import * as IMPORT from 'actions/constants/importAccount';

import type { Action } from 'flowtype';

export type ImportState = {
    loading: boolean,
    error: ?string,
};

export const initialState: ImportState = {
    loading: false,
    error: null,
};

export default (state: ImportState = initialState, action: Action): ImportState => {
    switch (action.type) {
        case IMPORT.START:
            return {
                ...state,
                loading: true,
                error: null,
            };

        case IMPORT.SUCCESS:
            return {
                ...state,
                loading: false,
                error: null,
            };

        case IMPORT.FAIL:
            return {
                ...state,
                loading: false,
                error: action.error,
            };

        default:
            return state;
    }
};
