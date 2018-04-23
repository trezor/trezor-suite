/* @flow */
'use strict';

import * as PENDING from './constants/pendingTx';
import type { State, PendingTx } from '../reducers/PendingTxReducer'

export type PendingTxAction = {
    type: typeof PENDING.FROM_STORAGE,
    payload: State
} | {
    type: typeof PENDING.TX_RESOLVED,
    tx: PendingTx,
    receipt: Object,
    block: string
}