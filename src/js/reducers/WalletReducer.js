/* @flow */
'use strict';

import * as WEB3 from '../actions/constants/web3';
import * as WALLET from '../actions/constants/wallet';

import type { Action, RouterLocationState } from '../flowtype';

type State = {
    ready: boolean;
    dropdownOpened: boolean;
    initialParams: ?RouterLocationState;
    initialPathname: ?string;
}

const initialState: State = {
    ready: false,
    dropdownOpened: false,
    initialParams: null,
    initialPathname: null,
};

export default function wallet(state: State = initialState, action: Action): State {
    switch(action.type) {

        case WALLET.SET_INITIAL_URL :
            return {
                ...state,
                initialParams: action.state,
                initialPathname: action.pathname
            }

        case WEB3.READY :
            return {
                ...state,
                ready: true
            }

        case WALLET.TOGGLE_DEVICE_DROPDOWN :
            return {
                ...state,
                dropdownOpened: action.opened
            }

        default:
            return state;
    }
}
