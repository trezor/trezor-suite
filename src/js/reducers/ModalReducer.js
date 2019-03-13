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

    coinInfo?: any;
    accounts?: Array<any>;
    customFeeOpened?: boolean;
    customFee: number;
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

    customFee: 0,
};

export default function modal(state: ModalState = initialState, action: any): any {

    switch (action.type) {

        case UI.ADDRESS_VALIDATION:
            return {
                ...state,
                opened: true,
                windowType: action.type
            };

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

        case UI.SELECT_DEVICE :
            return {
                ...state,
                opened: true,
                windowType: action.type
            };

        case UI.SELECT_ACCOUNT :
            return {
                ...state,
                opened: true,
                windowType: action.type,
                accounts: action.data.accounts,
                coinInfo: action.data.coinInfo,
                complete: action.data.complete
            };

        case UI.SELECT_FEE :
            return {
                ...state,
                opened: true,
                windowType: action.type,
                feeList: action.data.list,
                coinInfo: action.data.coinInfo,
            };

        case UI.UPDATE_CUSTOM_FEE :
            return {
                ...state,
                opened: true,
                windowType: action.type
            };

        case UI.INSUFFICIENT_FUNDS :
            return {
                ...state,
                opened: true,
                windowType: action.type
            };
        case UI.REQUEST_BUTTON :
            return {
                ...state,
                opened: true,
                windowType: action.type
            };

        
        case UI.CLOSE_UI_WINDOW :
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

        case ACTIONS.ON_CUSTOM_FEE_OPEN :
            return {
                ...state,
                customFeeOpened: true
            }
        case ACTIONS.ON_CUSTOM_FEE_CHANGE :
            return {
                ...state,
                customFee: action.value
            }

        default:
            return state;
    }

}