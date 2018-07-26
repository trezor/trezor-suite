/* @flow */
'use strict';

import { LOCATION_CHANGE } from 'react-router-redux';
import { COIN_CHANGE, PATH_CHANGE, MESSAGE_CHANGE } from '../../actions/methods/MessageActions';

type MethodState = {
    +js: string;
    +fields: Array<string>;

    path: string;
    message: string;
    coin: string;
}

const defaultPaths = {
    "btc":   "m/49'/0'/0'",
    "bch":   "m/44'/145'/0'",
    "btg":   "m/44'/156'/0'",
    "ltc":   "m/49'/2'/0'",
    "dash":  "m/44'/5'/0'",
    "zcash": "m/44'/133'/0'",
    "test":  "m/49'/1'/0'",
    "doge":  "m/44'/3'/0'",
    "vtc":   "m/44'/28'/0'",
}

const initialState: MethodState = {
    js: 'TrezorConnect.signMessage',
    fields: ['path', 'message', 'coin'],

    path: "m/49'/0'/0'",
    message: 'Example message',
    coin: 'btc',
};

export default function method(state: MethodState = initialState, action: any): any {

    switch (action.type) {

        case LOCATION_CHANGE :
            return initialState;

        case COIN_CHANGE :

            if (action.coin === '') {
                return {
                    ...state,
                    coin: action.coin,
                    fields: state.fields.filter(f => f !== 'coin')
                }
            } else {
                return {
                    ...state,
                    coin: action.coin,
                    path: defaultPaths[action.coin],
                    fields: ['path', 'message', 'coin']
                }
            }

        case PATH_CHANGE :
            return {
                ...state,
                path: action.path
            };

        case MESSAGE_CHANGE :
            return {
                ...state,
                message: action.message
            };

        default:
            return state;
    }
}