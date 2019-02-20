/* @flow */

import { LOCATION_CHANGE } from 'connected-react-router';
import { TX_CHANGE, PATH_CHANGE, PASSPHRASE_CHANGE } from '../../actions/methods/StellarSignTxActions';

type MethodState = {
    +js: string;
    +fields: Array<string>;

    path: string;
    networkPassphrase: string;
    transaction: string;
}

const defaultTx: string = 
`{
    source: "GAXSFOOGF4ELO5HT5PTN23T5XE6D5QWL3YBHSVQ2HWOFEJNYYMRJENBV",
    fee: 100,
    sequence: 4294967296,
    timebounds: {
        minTime: null,
        maxTime: null
    },
    memo: {
        id: null,
        type: 0,
        text: null,
        hash: null
    },
    operations: [
      {
        type: "payment",
        source: "GAXSFOOGF4ELO5HT5PTN23T5XE6D5QWL3YBHSVQ2HWOFEJNYYMRJENBV",
        destination: "GAXSFOOGF4ELO5HT5PTN23T5XE6D5QWL3YBHSVQ2HWOFEJNYYMRJENBV",
        asset: null,
        amount: "10000"
      }
    ]
}`;

const initialState: MethodState = {
    js: 'TrezorConnect.stellarSignTransaction',
    fields: ['path', 'networkPassphrase', 'transaction'],

    networkPassphrase: 'Test SDF Network ; September 2015',
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

        case PASSPHRASE_CHANGE :
            return {
                ...state,
                networkPassphrase: action.passphrase
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