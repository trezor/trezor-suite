/* @flow */
import * as CONNECT from 'actions/constants/TrezorConnect';
import * as PENDING from 'actions/constants/pendingTx';
import * as SEND from 'actions/constants/send';

import type { TrezorDevice, Action } from 'flowtype';

export type PendingTx = {
    +type: 'send' | 'recv',
    +hash: string,
    +network: string,
    +address: string,
    +currency: string,
    +amount: string,
    +total: string,
    +fee: string,
    rejected?: boolean,
};

export type State = Array<PendingTx>;

const initialState: State = [];

// const add = (state: State, action: SendTxAction): State => {
//     const newState = [...state];
//     newState.push({
//         type: 'send',
//         id: action.txid,
//         network: action.account.network,
//         address: action.account.address,
//         deviceState: action.account.deviceState,

//         currency: action.selectedCurrency,
//         amount: action.amount,
//         total: action.total,
//         tx: action.tx,
//         nonce: action.nonce,
//         rejected: false,
//     });
//     return newState;
// };


const addFromNotification = (state: State, payload: PendingTx): State => {
    const newState = [...state];
    newState.push(payload);
    return newState;
};

//const clear = (state: State, device: TrezorDevice): State => state.filter(tx => tx.deviceState !== device.state);

const remove = (state: State, hash: string): State => state.filter(tx => tx.hash !== hash);

const reject = (state: State, hash: string): State => state.map((tx) => {
    if (tx.hash === hash && !tx.rejected) {
        return { ...tx, rejected: true };
    }
    return tx;
});

export default function pending(state: State = initialState, action: Action): State {
    switch (action.type) {
        // case SEND.TX_COMPLETE:
        //     return add(state, action);

        // case CONNECT.FORGET:
        // case CONNECT.FORGET_SINGLE:
        // case CONNECT.FORGET_SILENT:
        // case CONNECT.RECEIVE_WALLET_TYPE:
        //     return clear(state, action.device);

        case PENDING.ADD:
            return addFromNotification(state, action.payload);
        case PENDING.TX_RESOLVED:
            return remove(state, action.hash);
        case PENDING.TX_REJECTED:
            return reject(state, action.hash);

        case PENDING.FROM_STORAGE:
            return action.payload;

        default:
            return state;
    }
}