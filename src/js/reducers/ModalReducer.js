/* @flow */
'use strict';

import { UI, DEVICE } from 'trezor-connect';
import * as ACTIONS from '../actions';

type ModalState = {
    opened: boolean;
    windowType: ?string;
    pin: string;
    passphrase: string;
    passphraseFocused: boolean;
    passphraseVisible: boolean;
    passphraseCached: boolean;
    confirmation: ?string;
}

const initialState: ModalState = {
    opened: false,
    windowType: null,
    pin: "",
    passphrase: "",
    passphraseFocused: false,
    passphraseVisible: false,
    passphraseCached: true,
    confirmation: null,
};

export default function modal(state: ModalState = initialState, action: any): any {

    switch (action.type) {

        case UI.REQUEST_PIN :
        case UI.INVALID_PIN :
        case UI.REQUEST_PASSPHRASE :
            return {
                ...state,
                opened: true,
                windowType: action.type
            };

        case UI.REQUEST_CONFIRMATION :
            return {
                ...state,
                opened: true,
                confirmation: action.data.label,
                windowType: action.type
            };

        case UI.REQUEST_PERMISSION :
            return {
                ...state,
                opened: true,
                confirmation: action.data.label,
                windowType: action.type
            };

        case ACTIONS.CLOSE_MODAL :
            return {
                ...initialState,
                passphraseCached: state.passphraseCached
            };


        case ACTIONS.ON_PIN_ADD :
            let pin: string = state.pin;
            if (pin.length < 9) {
                pin += action.number;
            }
            return {
                ...state,
                pin: pin,
            };
        case ACTIONS.ON_PIN_BACKSPACE :
            return {
                ...state,
                pin: state.pin.substring(0, state.pin.length - 1),
            };


        case ACTIONS.ON_PASSPHRASE_CHANGE :
            return {
                ...state,
                passphrase: action.value
            }
        case ACTIONS.ON_PASSPHRASE_SHOW :
            return {
                ...state,
                passphraseVisible: true
            }
        case ACTIONS.ON_PASSPHRASE_HIDE :
            return {
                ...state,
                passphraseVisible: false
            }
        case ACTIONS.ON_PASSPHRASE_SAVE :
            return {
                ...state,
                passphraseCached: true
            }
        case ACTIONS.ON_PASSPHRASE_FORGET :
            return {
                ...state,
                passphraseCached: false
            }
        case ACTIONS.ON_PASSPHRASE_FOCUS :
            return {
                ...state,
                passphraseFocused: true
            }
        case ACTIONS.ON_PASSPHRASE_BLUR :
            return {
                ...state,
                passphraseFocused: false
            }

        default:
            return state;
    }

}