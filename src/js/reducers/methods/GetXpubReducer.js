/* @flow */
'use strict';

import { LOCATION_CHANGE } from 'react-router-redux';
import { UI, DEVICE } from 'trezor-connect';
import * as GetXpubActions from '../../actions/methods/GetXpubActions';

type MethodState = {
    +js: string;
    +fields: Array<string>;
    coin: string;
    path: string;
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
    "nmc":   "m/44'/7'/0'",
}

const initialState: MethodState = {
    js: 'TrezorConnect.getPublicKey',
    fields: ['coin', 'path'],
    coin: 'test',
    path: "m/49'/1'/0'",
};


export default function method(state: MethodState = initialState, action: any): any {

    switch (action.type) {

        case LOCATION_CHANGE :
            return initialState;

        case GetXpubActions.COIN_CHANGE :
            return {
                ...state,
                coin: action.coin,
                path: defaultPaths[action.coin]
            };

        case GetXpubActions.PATH_CHANGE :
            return {
                ...state,
                path: action.path
            };

        default:
            return state;
    }

}