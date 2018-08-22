/* @flow */
'use strict';

import { LOCATION_CHANGE } from 'react-router-redux';
import { TX_CHANGE, PATH_CHANGE } from '../../actions/methods/RippleSignTxActions';

type MethodState = {
    +js: string;
    +fields: Array<string>;

    path: string;
    transaction: string;
}

const defaultTx: string = 
`{
    fee: '100000',
    flags: 0x80000000,
    sequence: 25,
    payment: {
        amount: '100000000',
        destination: 'rBKz5MC2iXdoS3XgnNSYmF69K1Yo4NS3Ws'
    }
}`;

const initialState: MethodState = {
    js: 'TrezorConnect.rippleSignTransaction',
    fields: ['path', 'transaction'],

    path: "m/44'/144'/0'/0/0",
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