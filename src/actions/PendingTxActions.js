/* @flow */


import * as PENDING from 'actions/constants/pendingTx';

import type {
    Action, ThunkAction, GetState, Dispatch,
} from 'flowtype';
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
    type: typeof PENDING.TX_REJECTED,
    tx: PendingTx,
} | {
    type: typeof PENDING.TX_TOKEN_ERROR,
    tx: PendingTx,
}

export const reject = (tx: PendingTx): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    /*
            dispatch({
                    type: NOTIFICATION.ADD,
                    payload: {
                        type: 'warning',
                        title: 'Pending transaction rejected',
                        message: `Transaction with id: ${tx.id} not found.`,
                        cancelable: true,
                        actions: [
                            {
                                label: 'OK',
                                callback: () => {
                                    dispatch({
                                        type: PENDING.TX_RESOLVED,
                                        tx,
                                    });
                                },
                            },
                        ],
                    },
                });
            */
};