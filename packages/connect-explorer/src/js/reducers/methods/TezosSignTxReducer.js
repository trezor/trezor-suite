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
        source: "tz1ckrgqGGGBt4jGDmwFhtXc1LNpZJUnA9F2",
        destination: "tz1cTfmc5uuBr2DmHDgkXTAoEcufvXLwq5TP",
        counter: 20449,
        amount: 1000000000,
        fee: 10000,
        gas_limit: 11000,
        storage_limit: 277
    }
}`;

const initialState: MethodState = {
    js: 'TrezorConnect.tezosSignTransaction',
    fields: ['path', 'branch', 'operation'],

    path: "m/44'/1729'/0'",
    branch: "BLHRTdZ5vUKSDbkp5vcG1m6ZTST4SRiHWUhGodysLTbvACwi77d",
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