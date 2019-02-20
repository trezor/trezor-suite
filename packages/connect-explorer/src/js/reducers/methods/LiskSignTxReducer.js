/* @flow */

import { LOCATION_CHANGE } from 'connected-react-router';
import { PATH_CHANGE, TX_CHANGE } from '../../actions/methods/LiskSignTxActions';

type MethodState = {
    +js: string;
    +fields: Array<string>;

    path: string;
    transaction: string;
}

const defaultTx: string = 
`{
    amount: "10000000",
    recipientId: "9971262264659915921L",
    timestamp: 57525937,
    type: 0,
    fee: "20000000",
    asset: {
        data: "Test data"
    }
}`;

const initialState: MethodState = {
    js: 'TrezorConnect.liskSignTransaction',
    fields: ['path', 'transaction'],
    path: "m/44'/134'/0'/0'",
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