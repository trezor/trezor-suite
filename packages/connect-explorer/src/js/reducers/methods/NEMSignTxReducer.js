/* @flow */
'use strict';

import { LOCATION_CHANGE } from 'react-router-redux';
import { TX_CHANGE, PATH_CHANGE } from '../../actions/methods/NEMSignTxActions';

type MethodState = {
    +js: string;
    +fields: Array<string>;

    path: string;
    transaction: string;
}

const defaultTx: string = 
`{
    "timeStamp": 74649215,
    "fee": 2000000,
    "type": 16386,
    "deadline": 74735615,
    "mosaicId": {
        "namespaceId": "hellom",
        "name": "Hello mosaic"
    },
    "supplyType": 1,
    "delta": 1,
    "version": -1744830464,
    "creationFeeSink": "TALICE2GMA34CXHD7XLJQ536NM5UNKQHTORNNT2J",
    "creationFee": 1500
}`;

const initialState: MethodState = {
    js: 'TrezorConnect.nemSignTransaction',
    fields: ['path', 'transaction'],

    path: "m/44'/43'/0'",
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