/* @flow */

import type { Action } from 'flowtype';
import type { NetworkToken } from './LocalStorageReducer';

import { SIGN_SUCCESS } from '../actions/constants/signVerify';

export type State = {
    details: boolean;
    selectedToken: ?NetworkToken;
}

export const initialState: State = {
    signature: null,
};

export default (state: State = initialState, action: Action): State => {
    switch (action.type) {
        case SIGN_SUCCESS:
            return {
                ...state,
                signature: state.signature,
            };

        default:
            return state;
    }
};