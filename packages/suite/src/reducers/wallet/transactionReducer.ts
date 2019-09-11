// import * as CONNECT from '@wallet-actions/constants/TrezorConnect';
// import * as WALLET from '@wallet-actions/constants/wallet';
import * as TRANSACTION from '@wallet-actions/constants/transactionConstants';
import produce from 'immer';

import { Action } from '@wallet-types/index';
import { TransactionAction } from '@suite/actions/wallet/transactionActions';
import { AccountTransaction } from 'trezor-connect';

export interface WalletAccountTransaction extends AccountTransaction {
    id?: number;
    accountId: string;
}

export type State = {
    transactions: WalletAccountTransaction[];
    isLoading: boolean;
    error: string | null;
};

const initialState: State = {
    transactions: [],
    isLoading: false,
    error: null,
};

const update = (draft: State, action: TransactionAction) => {
    // @ts-ignore TODO: figure out why it doesn't pick correct action
    const tx = draft.transactions.find(tx => tx.txId === action.txId);
    if (tx) {
        // @ts-ignore TODO: figure out why it doesn't pick correct action
        tx.timestamp = action.timestamp;
    }
};

export default (state: State = initialState, action: Action): State => {
    return produce(state, draft => {
        switch (action.type) {
            case TRANSACTION.ADD:
                draft.transactions.push(action.transaction);
                break;
            case TRANSACTION.REMOVE:
                draft.transactions.splice(draft.transactions.findIndex(tx => tx.txid === action.txId), 1);
                break;
            case TRANSACTION.UPDATE:
                update(draft, action);
                break;
            case TRANSACTION.FETCH_INIT:
                draft.isLoading = true;
                break;
            case TRANSACTION.FETCH_SUCCESS:
                draft.isLoading = false;
                draft.transactions = action.transactions;
                break;
            case TRANSACTION.FETCH_ERROR:
                draft.error = action.error;
                draft.isLoading = false;
                break;
            // case TRANSACTION.FROM_STORAGE:
            //     draft.transactions = action.transactions;
            // no default
        }
    });
};
