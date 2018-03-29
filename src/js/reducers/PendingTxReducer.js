/* @flow */
'use strict';

import * as SEND from '../actions/constants/SendForm';
import * as WEB3 from '../actions/constants/Web3';

export type PendingTx = {
    +id: string;
    +network: string;
    +token: string;
    +amount: string;
    +address: string;
}

const initialState: Array<PendingTx> = [];

const add = (state: Array<PendingTx>, action: any) => {
    const newState = [ ...state ];
    newState.push({
        id: action.txid,
        network: action.address.network,
        token: action.token,
        amount: action.amount,
        address: action.address.address,
    });
    return newState;
}

const remove = (state: Array<PendingTx>, action: any) => {
    return state.filter(tx => tx.id !== action.tx.id);
}

const fromStorage = (state: Array<PendingTx>, action: any) => {
    return state.filter(tx => tx.id !== action.tx.id);
}

export default function pending(state: Array<PendingTx> = initialState, action: any): any {

    switch (action.type) {

        case SEND.TX_COMPLETE :
            return add(state, action);

        case WEB3.PENDING_TX_RESOLVED :
            return remove(state, action);

        case 'PENDING.FROM_STORAGE' :
            return action.payload;

        default:
            return state;
    }

}