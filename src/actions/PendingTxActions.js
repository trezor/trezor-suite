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
    hash: string,
} | {
    type: typeof PENDING.TX_REJECTED,
    hash: string,
} | {
    type: typeof PENDING.TX_TOKEN_ERROR,
    hash: string,
}