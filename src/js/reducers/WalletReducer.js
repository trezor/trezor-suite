/* @flow */
'use strict';

import * as WEB3 from '../actions/constants/Web3';
import * as WALLET from '../actions/constants/wallet';

type State = {
    ready: boolean;
    dropdownOpened: boolean;
    initialUrl: boolean;
}

const initialState: Object = {
    ready: false,
    dropdownOpened: false,
    initialParams: null,
    initialPathname: null,
};

export default function wallet(state: Object = initialState, action: Object): any {
    switch(action.type) {

        case WALLET.SET_INITIAL_URL :
            return {
                ...state,
                initialParams: action.params,
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
