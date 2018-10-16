/* @flow */

import type { Action } from 'flowtype';
import type { NetworkToken } from './LocalStorageReducer';

export type State = {
    details: boolean;
    selectedToken: ?NetworkToken;
}

const SIGN = 'sign';

export const initialState: State = {

};

export default (state: State = initialState, action: Action): State => {
    switch (action.type) {
        case SIGN.SUCCESS:
            return initialState;

        default:
            return state;
    }
};