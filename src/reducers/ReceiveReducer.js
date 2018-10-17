/* @flow */


import { UI } from 'trezor-connect';
import * as RECEIVE from 'actions/constants/receive';
import * as ACCOUNT from 'actions/constants/account';
import type { Action } from 'flowtype';

export type State = {
    addressVerified: boolean;
    addressUnverified: boolean;
}

export const initialState: State = {
    addressVerified: false,
    addressUnverified: false,
};

export default (state: State = initialState, action: Action): State => {
    switch (action.type) {
        case RECEIVE.INIT:
            return action.state;

        case ACCOUNT.DISPOSE:
            return initialState;

        case RECEIVE.SHOW_ADDRESS:
            return {
                ...state,
                addressVerified: true,
                addressUnverified: false,
            };
        case RECEIVE.HIDE_ADDRESS:
            return initialState;

        case RECEIVE.SHOW_UNVERIFIED_ADDRESS:
            return {
                ...state,
                addressVerified: false,
                addressUnverified: true,
            };

        case UI.REQUEST_BUTTON:
            if (action.payload.code === 'ButtonRequest_Address') {
                return {
                    ...state,
                    addressVerified: true,
                };
            }
            return state;

        default:
            return state;
    }
};