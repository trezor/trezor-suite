/* @flow */
'use strict';

import { LOCATION_CHANGE } from 'react-router-redux';
import { UI, DEVICE } from 'trezor-connect';
import { COIN_CHANGE, PATH_CHANGE } from '../../actions/methods/GetAccountInfoActions';

type MethodState = {
    +js: string;
    fields: Array<string>;

    coin: string;
    path: string;
    xpub: string;
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
    "cpc":   "m/44'/289'/0'",
}

const initialState: MethodState = {
    js: 'TrezorConnect.getAccountInfo',
    fields: ['path', 'coin'],
    coin: 'btc',
    path: "m/49'/0'/0'",
    xpub: '',
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
                    fields: ['path', 'coin']
                }
            }

        case PATH_CHANGE :
            if (action.path === '') {
                return {
                    ...state,
                    path: '',
                    xpub: '',
                    fields: ['coin'],
                }
            } else if (action.path.indexOf("m/") !== 0) {
                return {
                    ...state,
                    path: action.path, // fill input
                    xpub: action.path,
                    fields: state.fields.filter(f => f !== 'path' && f !== 'xpub').concat(['xpub'])
                }
            } else {
                return {
                    ...state,
                    path: action.path,
                    xpub: '',
                    fields: state.fields.filter(f => f !== 'path' && f !== 'xpub').concat(['path'])
                };
            }
            

        default:
            return state;
    }

}