// import * as CONNECT from '@wallet-actions/constants/TrezorConnect';
// import * as WALLET from '@wallet-actions/constants/wallet';
import * as TRANSACTION from '@wallet-actions/constants/transactionConstants';
import produce from 'immer';
import { Transaction } from '@wallet-actions/transactionActions';

import { Action } from '@suite-types/index';

export type State = Transaction[];

const initialState: State = [];

export default (state: State = initialState, action: Action): State => {
    return produce(state, draft => {
        switch (action.type) {
            case TRANSACTION.ADD:
                draft.push(action.transaction);
                break;
            case TRANSACTION.REMOVE:
                draft.splice(draft.findIndex(tx => tx.txId === action.txId), 1);
                break;
            case TRANSACTION.FROM_STORAGE:
                return action.transactions;
            // no default
        }
    });
};
