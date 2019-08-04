// import * as CONNECT from '@wallet-actions/constants/TrezorConnect';
// import * as WALLET from '@wallet-actions/constants/wallet';
import * as TRANSACTION from '@wallet-actions/constants/transactionConstants';
import produce from 'immer';

import { Action } from '@wallet-types/index';
import { WalletTransaction } from '@suite/storage';
import { TransactionAction } from '@suite/actions/wallet/transactionActions';

export type State = WalletTransaction[];

const initialState: State = [];

const update = (draft: State, action: TransactionAction) => {
    const tx = draft.find(tx => tx.txId === action.txId);
    if (tx) {
        tx.timestamp = action.timestamp;
    }
};

export default (state: State = initialState, action: Action): State => {
    return produce(state, draft => {
        switch (action.type) {
            case TRANSACTION.ADD:
                draft.push(action.transaction);
                break;
            case TRANSACTION.REMOVE:
                draft.splice(draft.findIndex(tx => tx.txId === action.txId), 1);
                break;
            case TRANSACTION.UPDATE:
                update(draft, action);
                break;
            case TRANSACTION.FROM_STORAGE:
                return action.transactions;
            // no default
        }
    });
};
