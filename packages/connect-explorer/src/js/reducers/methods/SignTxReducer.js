/* @flow */
'use strict';

import { LOCATION_CHANGE } from 'react-router-redux';
import { COIN_CHANGE, INPUTS_CHANGE, OUTPUTS_CHANGE, PUSH_CHANGE } from '../../actions/methods/SignTxActions';

type MethodState = {
    +js: string;
    +fields: Array<string>;

    coin: string;
    inputs: string;
    outputs: string;
    push: boolean;
}

const defaultInputs: string = 
`[{
    address_n: [49 | 0x80000000, 1 | 0x80000000, 0 | 0x80000000, 1, 0],
    amount: 123456789,
    prev_index: 0,
    prev_hash: "20912f98ea3ed849042efed0fdac8cb4fc301961c5988cba56902d8ffb61c337",
    script_type: "SPENDP2SHWITNESS"
}]`;

const defaultOutputs: string = 
`[{
    address: "mhRx1CeVfaayqRwq5zgRQmD7W5aWBfD5mC",
    amount: 12300000,
    script_type: "PAYTOADDRESS"
},
{
    address_n: [49 | 0x80000000, 1 | 0x80000000, 0 | 0x80000000, 1, 0],
    script_type: "PAYTOP2SHWITNESS",
    amount: 123456789 - 11000 - 12300000,
}]`;

const initialState: MethodState = {
    js: 'TrezorConnect.signTransaction',
    fields: ['coin', 'inputs', 'outputs', 'push'],

    coin: "test",
    inputs: defaultInputs,
    outputs: defaultOutputs,
    push: false
};

export default function method(state: MethodState = initialState, action: any): any {

    switch (action.type) {

        case LOCATION_CHANGE :
            return initialState;

        case COIN_CHANGE :
            return {
                ...state,
                coin: action.coin
            };

        case INPUTS_CHANGE :
            return {
                ...state,
                inputs: action.inputs
            };

        case OUTPUTS_CHANGE :
            return {
                ...state,
                outputs: action.outputs
            };

        case PUSH_CHANGE :
            return {
                ...state,
                push: action.push
            };

        default:
            return state;
    }
}