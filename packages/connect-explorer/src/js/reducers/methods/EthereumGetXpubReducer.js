/* @flow */

import { LOCATION_CHANGE } from 'connected-react-router';
import { UI, DEVICE } from 'trezor-connect';
import * as GetXpubActions from '../../actions/methods/EthereumGetXpubActions';

type MethodState = {
    +js: string;
    fields: Array<string>;

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
    "vtc":   "m/44'/28'/0'",
}

const initialState: MethodState = {
    js: 'TrezorConnect.ethereumGetPublicKey',
    fields: ['path'],
    coin: '',
    path: "m/44'/60'/0'",
};


export default function method(state: MethodState = initialState, action: any): any {

    switch (action.type) {

        case LOCATION_CHANGE :
            return initialState;

        case GetXpubActions.COIN_CHANGE :
            if (action.coin === '') {
                return {
                    ...state,
                    coin: '',
                    fields: ['path']
                }
            } else {
                return {
                    ...state,
                    coin: action.coin,
                    path: defaultPaths[action.coin],
                    fields: ['path', 'coin']
                };
            }
            

        case GetXpubActions.PATH_CHANGE :
            return {
                ...state,
                path: action.path
            };

        default:
            return state;
    }

}