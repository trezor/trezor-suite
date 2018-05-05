/* @flow */
'use strict';

import { LOCATION_CHANGE } from 'react-router-redux';
import { DEVICE } from 'trezor-connect';
import * as MODAL from '../actions/constants/modal';
import * as WEB3 from '../actions/constants/web3';
import * as WALLET from '../actions/constants/wallet';
import * as CONNECT from '../actions/constants/TrezorConnect';


import type { Action, RouterLocationState, TrezorDevice } from '../flowtype';

type State = {
    ready: boolean;
    dropdownOpened: boolean;
    initialParams: ?RouterLocationState;
    initialPathname: ?string;
    disconnectRequest: ?TrezorDevice;
}

const initialState: State = {
    ready: false,
    dropdownOpened: false,
    initialParams: null,
    initialPathname: null,
    disconnectRequest: null
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

        case LOCATION_CHANGE : 
        case MODAL.CLOSE : 
            return {
                ...state,
                dropdownOpened: false
            }

        case CONNECT.DISCONNECT_REQUEST :
            return {
                ...state,
                disconnectRequest: action.device
            }

        case DEVICE.DISCONNECT :
            if (state.disconnectRequest && action.device.path === state.disconnectRequest.path) {
                return {
                    ...state,
                    disconnectRequest: null
                }
            }
            return state;

        default:
            return state;
    }
}
