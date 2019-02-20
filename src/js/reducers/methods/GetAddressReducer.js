/* @flow */
'use strict';

import { LOCATION_CHANGE } from 'react-router-redux';
import { UI, DEVICE } from 'trezor-connect';
import { CONFIRMATION_CHANGE, COIN_CHANGE, PATH_CHANGE, ADDRESS_CHANGE } from '../../actions/methods/GetAddressActions';
import { RESPONSE } from '../../actions/methods/CommonActions';

type MethodState = {
    +js: string;
    fields: Array<string>;

    path: string;
    coin: string;
    showOnTrezor: boolean;
}

const defaultPaths = {
    "btc":   "m/49'/0'/0'/0/0",
    "bch":   "m/44'/145'/0'/0/0",
    "btg":   "m/44'/156'/0'/0/0",
    "ltc":   "m/49'/2'/0'/0/0",
    "dash":  "m/44'/5'/0'/0/0",
    "zcash": "m/44'/133'/0'/0/0",
    "test":  "m/49'/1'/0'/0/0",
    "doge":  "m/44'/3'/0'/0/0",
    "vtc":   "m/44'/28'/0'/0/0",
    "cpc":   "m/44'/289'/0'/0/0",
}

const initialState: MethodState = {
    js: 'TrezorConnect.getAddress',
    fields: ['path', 'showOnTrezor'],
    
    path: "m/49'/0'/0'/0/0",
    address: '',
    addressValidation: false,
    coin: '',
    showOnTrezor: true,
};


export default function method(state: MethodState = initialState, action: any): any {

    switch (action.type) {

        case LOCATION_CHANGE :
            return initialState;

        case PATH_CHANGE :
            return {
                ...state,
                path: action.path,
            };

        case ADDRESS_CHANGE :
            return {
                ...state,
                address: action.address,
                addressValidation: false,
            };

        case UI.ADDRESS_VALIDATION:
            return {
                ...state,
                addressValidation: true,
            }

        case RESPONSE:
            return {
                ...state,
                addressValidation: false,
            }

        case COIN_CHANGE :
            if (action.coin === '') {
                return {
                    ...state,
                    coin: '',
                    fields: ['path', 'showOnTrezor']
                }
            } else {
                return {
                    ...state,
                    coin: action.coin,
                    path: defaultPaths[action.coin],
                    fields: ['path', 'coin', 'showOnTrezor']
                };
            }

        case CONFIRMATION_CHANGE :
            return {
                ...state,
                showOnTrezor: action.showOnTrezor
            };
            

        default:
            return state;
    }

}