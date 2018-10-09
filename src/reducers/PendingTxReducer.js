/* @flow */
import * as CONNECT from 'actions/constants/TrezorConnect';
import * as PENDING from 'actions/constants/pendingTx';
import * as SEND from 'actions/constants/send';

import type { TrezorDevice, Action } from 'flowtype';
import type { SendTxAction } from 'actions/SendFormActions';

export type PendingTx = {
    +type: 'send' | 'receive';
    +id: string;
    +network: string;
    +address: string;
    +deviceState: string;
    +currency: string;
    +amount: string;
    +total: string;
    +tx: any;
    +nonce: number;
    rejected: boolean;
}

export type State = Array<PendingTx>;

const initialState: State = [];

const add = (state: State, action: SendTxAction): State => {
    const newState = [...state];
    newState.push({
        type: 'send',
        id: action.txid,
        network: action.account.network,
        address: action.account.address,
        deviceState: action.account.deviceState,

        currency: action.selectedCurrency,
        amount: action.amount,
        total: action.total,
        tx: action.tx,
        nonce: action.nonce,
        rejected: false,
    });
    return newState;
};

/*
const addFromBloockbokNotifiaction = (state: State, payload: any): State => {
    const newState = [...state];
    newState.push(payload);
    return newState;
};
*/

const clear = (state: State, device: TrezorDevice): State => state.filter(tx => tx.deviceState !== device.state);

const remove = (state: State, id: string): State => state.filter(tx => tx.id !== id);

const reject = (state: State, id: string): State => state.map((tx) => {
    if (tx.id === id && !tx.rejected) {
        return { ...tx, rejected: true };
    }
    return tx;
});

export default function pending(state: State = initialState, action: Action): State {
    switch (action.type) {
        case SEND.TX_COMPLETE:
            return add(state, action);

        case CONNECT.FORGET:
        case CONNECT.FORGET_SINGLE:
        case CONNECT.FORGET_SILENT:
        case CONNECT.RECEIVE_WALLET_TYPE:
            return clear(state, action.device);

        // case PENDING.ADD:
        //    return add(state, action.payload);
        case PENDING.TX_RESOLVED:
            return remove(state, action.tx.id);
        case PENDING.TX_REJECTED:
            return reject(state, action.tx.id);

        case PENDING.FROM_STORAGE:
            return action.payload;

        default:
            return state;
    }
}