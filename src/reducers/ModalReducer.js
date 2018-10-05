/* @flow */


import { UI, DEVICE } from 'trezor-connect';
import * as RECEIVE from 'actions/constants/receive';
import * as MODAL from 'actions/constants/modal';
import * as CONNECT from 'actions/constants/TrezorConnect';

import type { Action, TrezorDevice } from 'flowtype';

export type State = {
    opened: false;
} | {
    opened: true;
    device: TrezorDevice;
    instances?: Array<TrezorDevice>;
    windowType?: string;
}

const initialState: State = {
    opened: false,
    // instances: null,
    // windowType: null
};

export default function modal(state: State = initialState, action: Action): State {
    switch (action.type) {
        case RECEIVE.REQUEST_UNVERIFIED:
            return {
                opened: true,
                device: action.device,
                windowType: action.type,
            };

        case CONNECT.REQUEST_WALLET_TYPE:
            return {
                opened: true,
                device: action.device,
                windowType: action.type,
            };

        case CONNECT.REMEMBER_REQUEST:
            return {
                opened: true,
                device: action.device,
                instances: action.instances,
                windowType: action.type,
            };
        case CONNECT.FORGET_REQUEST:
            return {
                opened: true,
                device: action.device,
                windowType: action.type,
            };

        case CONNECT.TRY_TO_DUPLICATE:
            return {
                opened: true,
                device: action.device,
                windowType: action.type,
            };

        case DEVICE.CHANGED:
            if (state.opened && action.device.path === state.device.path && action.device.status === 'occupied') {
                return initialState;
            }

            return state;

        case DEVICE.DISCONNECT:
            if (state.opened && action.device.path === state.device.path) {
                return initialState;
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

        case UI.REQUEST_PIN:
        case UI.INVALID_PIN:
        case UI.REQUEST_PASSPHRASE:
            return {
                opened: true,
                device: action.payload.device,
                windowType: action.type,
            };

        case UI.REQUEST_BUTTON:
            return {
                opened: true,
                device: action.payload.device,
                windowType: action.payload.code,
            };

        case UI.CLOSE_UI_WINDOW:
        case MODAL.CLOSE:
        case CONNECT.FORGET:
        case CONNECT.FORGET_SINGLE:
        case CONNECT.REMEMBER:
            return initialState;

        default:
            return state;
    }
}