/* @flow */


import * as PENDING from 'actions/constants/pendingTx';
import type { State, PendingTx } from 'reducers/PendingTxReducer';

export type PendingTxAction = {
    type: typeof PENDING.FROM_STORAGE,
    payload: State
} | {
    type: typeof PENDING.ADD,
    payload: PendingTx
} | {
    type: typeof PENDING.TX_RESOLVED,
    tx: PendingTx,
    receipt?: Object,
} | {
    type: typeof PENDING.TX_NOT_FOUND,
    tx: PendingTx,
} | {
    type: typeof PENDING.TX_TOKEN_ERROR,
    tx: PendingTx,
}