/* @flow */
'use strict';

import { LOCATION_CHANGE } from 'react-router-redux';
import { OPERATION_CHANGE, PATH_CHANGE, BRANCH_CHANGE } from '../../actions/methods/TezosSignTxActions';

type MethodState = {
    +js: string;
    +fields: Array<string>;

    path: string;
    branch: string;
    operation: string;
}

const defaultOp: string = 
`{
    transaction: {
        source: {
            tag: 0,
            hash: "00001e65c88ae6317cd62a638c8abd1e71c83c8475",
        },
        fee: 0,
        counter: 108925,
        gas_limit: 200,
        storage_limit: 0,
        amount: 10000,
        destination: {
            tag: 0,
            hash: "0004115bce5af2f977acbb900f449c14c53e1d89cf",
        },
    },
}`;

const initialState: MethodState = {
    js: 'TrezorConnect.tezosSignTransaction',
    fields: ['path', 'branch', 'operation'],

    path: "m/44'/1729'/0'",
    branch: "f2ae0c72fdd41d7a89bebfe8d6dd6d38e0fcd0782adb8194717176eb70366f64",
    operation: defaultOp,
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

        case BRANCH_CHANGE :
            return {
                ...state,
                branch: action.branch
            };

        case OPERATION_CHANGE :
            return {
                ...state,
                operation: action.operation
            };

        default:
            return state;
    }
}