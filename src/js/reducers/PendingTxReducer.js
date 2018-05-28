/* @flow */
'use strict';

import * as PENDING from '../actions/constants/pendingTx';
import * as SEND from '../actions/constants/send';
import * as WEB3 from '../actions/constants/web3';

import type { Action } from '~/flowtype';
import type { SendTxAction } from '../actions/SendFormActions';

export type PendingTx = {
    +id: string;
    +network: string;
    +currency: string;
    +amount: string;
    +total: string;
    +tx: any;
    +address: string;
}

export type State = Array<PendingTx>;

const initialState: State = [];

const add = (state: State, action: SendTxAction): State => {
    const newState = [ ...state ];
    newState.push({
        id: action.txid,
        network: action.account.network,
        currency: action.selectedCurrency,
        amount: action.amount,
        total: action.total,
        tx: action.tx,
        address: action.account.address,
    });
    return newState;
}

const remove = (state: State, id: string): State => {
    return state.filter(tx => tx.id !== id);
}

export default function pending(state: State = initialState, action: Action): State {

    switch (action.type) {

        case SEND.TX_COMPLETE :
            return add(state, action);

        case PENDING.TX_RESOLVED :
        case PENDING.TX_NOT_FOUND :
            return remove(state, action.tx.id);

        case PENDING.FROM_STORAGE :
            return action.payload;

        default:
            return state;
    }

}