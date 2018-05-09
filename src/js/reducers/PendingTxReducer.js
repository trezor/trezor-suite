/* @flow */
'use strict';

import * as PENDING from '../actions/constants/pendingTx';
import * as SEND from '../actions/constants/send';
import * as WEB3 from '../actions/constants/web3';

import type { Action } from '../flowtype';

export type PendingTx = {
    +id: string;
    +network: string;
    +token: string;
    +amount: string;
    +address: string;
}

export type State = Array<PendingTx>;

const initialState: State = [];

const add = (state: State, action: any) => {
    const newState = [ ...state ];
    newState.push({
        id: action.txid,
        network: action.account.network,
        address: action.account.address,
        token: action.token,
        amount: action.amount,
    });
    return newState;
}

const remove = (state: State, action: any) => {
    return state.filter(tx => tx.id !== action.tx.id);
}

const fromStorage = (state: State, action: any) => {
    return state.filter(tx => tx.id !== action.tx.id);
}

export default function pending(state: State = initialState, action: Action): State {

    switch (action.type) {

        case SEND.TX_COMPLETE :
            return add(state, action);

        case PENDING.TX_RESOLVED :
            return remove(state, action);

        case PENDING.FROM_STORAGE :
            return action.payload;

        default:
            return state;
    }

}