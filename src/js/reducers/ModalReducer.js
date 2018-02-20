/* @flow */
'use strict';

import { UI, DEVICE } from 'trezor-connect';
import * as ACTIONS from '../actions';
import * as RECEIVE from '../actions/constants/receive';
import * as MODAL from '../actions/constants/Modal';
import * as CONNECT from '../actions/constants/TrezorConnect';

type ModalState = {
    opened: boolean;
    device: any;
    windowType: ?string;
}

const initialState: ModalState = {
    opened: false,
    device: null,
    windowType: null
};

export default function modal(state: ModalState = initialState, action: any): any {

    switch (action.type) {

        case RECEIVE.REQUEST_UNVERIFIED :
            return {
                ...state,
                opened: true,
                windowType: action.type
            }

        case CONNECT.REMEMBER_REQUEST :
        case CONNECT.FORGET_REQUEST :
        case CONNECT.DISCONNECT_REQUEST :
            return {
                ...state,
                device: action.device,
                opened: true,
                windowType: action.type
            };

        case CONNECT.TRY_TO_DUPLICATE :
            return {
                ...state,
                device: action.device,
                opened: true,
                windowType: action.type
            };

        case DEVICE.CHANGED :
            if (state.opened && state.device && action.device.path === state.device.path && action.device.isUsedElsewhere) {
                return {
                    ...initialState,
                };
            }
            return state;

        case DEVICE.DISCONNECT :
            if (state.device && action.device.path === state.device.path) {
                return {
                    ...initialState,
                }
            }
            return state;

        // case DEVICE.CONNECT :
        // case DEVICE.CONNECT_UNACQUIRED : 
        //     if (state.opened && state.windowType === CONNECT.TRY_TO_FORGET) {
        //         return {
        //             ...initialState,
        //             passphraseCached: state.passphraseCached
        //         }
        //     }
        //     return state;

        case UI.REQUEST_PIN :
        case UI.INVALID_PIN :
        case UI.REQUEST_PASSPHRASE :
            return {
                ...state,
                device: action.data.device,
                opened: true,
                windowType: action.type
            };

        case UI.REQUEST_BUTTON :
            return {
                ...state,
                opened: true,
                windowType: action.data.code
            }
        
        case UI.CLOSE_UI_WINDOW :
        case ACTIONS.CLOSE_MODAL :
        
        case CONNECT.FORGET :
        case CONNECT.FORGET_SINGLE :
        case CONNECT.REMEMBER :
            return {
                ...initialState,
            };

            

        default:
            return state;
    }

}