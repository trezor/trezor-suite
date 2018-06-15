/* @flow */
'use strict';

import { LOCATION_CHANGE } from 'react-router-redux';
import { TX_CHANGE, PATH_CHANGE } from '../../actions/methods/EthereumSignTxActions';

type MethodState = {
    +js: string;
    +fields: Array<string>;

    path: string;
    transaction: string;
}

const defaultTx: string = 
`{
    "to": "0x7314e0f1c0e28474bdb6be3e2c3e0453255188f8",
    "value": "0xf4240",
    "data": "0x01",
    "chainId": 1,
    "nonce": "0x0",
    "gasLimit": "0x5208",
    "gasPrice": "0xbebc200"
}`

const initialState: MethodState = {
    js: 'TrezorConnect.ethereumSignTransaction',
    fields: ['path', 'transaction'],

    path: "m/44'/60'/0'",
    transaction: defaultTx,

};

export default function method(state: MethodState = initialState, action: any): any {

    switch (action.type) {

        case LOCATION_CHANGE :
            return initialState;

        case PATH_CHANGE :
            return {
                ...state,
                path: action.path
            };

        case TX_CHANGE :
            return {
                ...state,
                transaction: action.transaction
            };

        default:
            return state;
    }
}