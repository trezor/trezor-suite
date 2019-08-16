// import * as CONNECT from '@wallet-actions/constants/TrezorConnect';
// import * as WALLET from '@wallet-actions/constants/wallet';
import * as TRANSACTION from '@wallet-actions/constants/transactionConstants';
import produce from 'immer';

import { Action } from '@wallet-types/index';
import { TransactionAction } from '@suite/actions/wallet/transactionActions';
import { WalletAccountTransaction } from '@storage-types';

export type State = WalletAccountTransaction[];

const initialState: State = [];

const update = (draft: State, action: TransactionAction) => {
    // @ts-ignore TODO: figure out why it doesn't pick correct action
    const tx = draft.find(tx => tx.txId === action.txId);
    if (tx) {
        // @ts-ignore TODO: figure out why it doesn't pick correct action
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
                draft.splice(draft.findIndex(tx => tx.txid === action.txId), 1);
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
