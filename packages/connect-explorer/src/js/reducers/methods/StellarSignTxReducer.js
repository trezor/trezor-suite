/* @flow */
'use strict';

import { LOCATION_CHANGE } from 'react-router-redux';
import { TX_CHANGE, PATH_CHANGE } from '../../actions/methods/StellarSignTxActions';

type MethodState = {
    +js: string;
    +fields: Array<string>;

    path: string;
    transaction: string;
}

/*
let message = {
            protocol_version: 1,
            source_account: '5d55642466b185b843152e9e219151dbc5892027ec40101a517bed5ca030c2e0',
            fee: 100,
            sequence_number: 0x100000000,
            network_passphrase: 'Test SDF Network ; September 2015',
            timebounds_start: null,
            timebounds_end: null,
            memo_type: 0,
            memo_text: null,
            memo_id: null,
            memo_hash: null,

            operations: [
                {
                    type: 'StellarPaymentOp',
                    params: {
                        source_account: '5d55642466b185b843152e9e219151dbc5892027ec40101a517bed5ca030c2e0',
                        destination_account: '5d55642466b185b843152e9e219151dbc5892027ec40101a517bed5ca030c2e0',
                        amount: 10000
                    }
                },
            ]
        };*/

const defaultTx: string = 
`{
    "protocol_version": 1,
    "source_account": "5d55642466b185b843152e9e219151dbc5892027ec40101a517bed5ca030c2e0",
    "fee": 100,
    "sequence_number": 4294967296,
    "network_passphrase": "Test SDF Network ; September 2015",
    "timebounds_start": null,
    "timebounds_end": null,
    "memo_type": 0,
    "memo_text": null,
    "memo_id": null,
    "memo_hash": null,
    "operations": [
      {
        "type": "StellarPaymentOp",
        "params": {
          "source_account": "5d55642466b185b843152e9e219151dbc5892027ec40101a517bed5ca030c2e0",
          "destination_account": "5d55642466b185b843152e9e219151dbc5892027ec40101a517bed5ca030c2e0",
          "amount": 10000
        }
      }
    ]
}`;

const initialState: MethodState = {
    js: 'TrezorConnect.stellarSignTransaction',
    fields: ['path', 'transaction'],

    path: "m/44'/148'/0'",
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