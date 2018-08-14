/* @flow */


import * as ACCOUNT from 'actions/constants/account';
import * as SUMMARY from 'actions/constants/summary';
import type { Action } from 'flowtype';
import type { NetworkToken } from './LocalStorageReducer';

export type State = {
    details: boolean;
    selectedToken: ?NetworkToken;
}

export const initialState: State = {
    details: true,
    selectedToken: null,
};

export default (state: State = initialState, action: Action): State => {
    switch (action.type) {
        case ACCOUNT.DISPOSE:
            return initialState;

        case SUMMARY.INIT:
            return action.state;

        case SUMMARY.DISPOSE:
            return initialState;

        case SUMMARY.DETAILS_TOGGLE:
            return {
                ...state,
                details: !state.details,
            };

        default:
            return state;
    }
};