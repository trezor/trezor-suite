/* @flow */
import * as CONNECT from 'actions/constants/TrezorConnect';
import * as PENDING from 'actions/constants/pendingTx';

import type { Action } from 'flowtype';

export type PendingTx = {
    +type: 'send' | 'recv',
    +deviceState: string,
    +sequence: number,
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

const add = (state: State, payload: PendingTx): State => {
    const newState = [...state];
    newState.push(payload);
    return newState;
};

const removeByDeviceState = (state: State, deviceState: ?string): State => state.filter(tx => tx.deviceState !== deviceState);

const removeByHash = (state: State, hash: string): State => state.filter(tx => tx.hash !== hash);

const reject = (state: State, hash: string): State => state.map((tx) => {
    if (tx.hash === hash && !tx.rejected) {
        return { ...tx, rejected: true };
    }
    return tx;
});

export default function pending(state: State = initialState, action: Action): State {
    switch (action.type) {
        case CONNECT.FORGET:
        case CONNECT.FORGET_SINGLE:
        case CONNECT.FORGET_SILENT:
        case CONNECT.RECEIVE_WALLET_TYPE:
            return removeByDeviceState(state, action.device.state);

        case PENDING.ADD:
            return add(state, action.payload);
        case PENDING.TX_RESOLVED:
            return removeByHash(state, action.hash);
        case PENDING.TX_REJECTED:
            return reject(state, action.hash);

        case PENDING.FROM_STORAGE:
            return action.payload;

        default:
            return state;
    }
}