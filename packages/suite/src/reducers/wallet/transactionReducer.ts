// import * as CONNECT from '@wallet-actions/constants/TrezorConnect';
// import * as WALLET from '@wallet-actions/constants/wallet';
import * as TRANSACTION from '@wallet-actions/constants/transactionConstants';
import produce from 'immer';

import { Action } from '@wallet-types/index';
import { TransactionAction } from '@suite/actions/wallet/transactionActions';
import { AccountTransaction } from 'trezor-connect';

export interface WalletAccountTransaction extends AccountTransaction {
    id?: number;
    accountDescriptor: string;
    page?: number;
}

export interface State {
    transactions: WalletAccountTransaction[];
    isLoading: boolean;
    error: string | null;
}

const initialState: State = {
    transactions: [],
    isLoading: false,
    error: null,
};

const update = (draft: State, action: TransactionAction) => {
    // @ts-ignore TODO: figure out why it doesn't pick correct action
    const tx = draft.transactions.find(tx => tx.txid === action.txid);
    if (tx) {
        // @ts-ignore TODO: figure out why it doesn't pick correct action
        tx.timestamp = action.timestamp;
    }
};

const sortByBlockHeight = (a: WalletAccountTransaction, b: WalletAccountTransaction) => {
    // if both are missing the blockHeight don't change their order
    if (!a.blockHeight && !b.blockHeight) return 0;
    // tx with no blockHeight comes first
    if (!a.blockHeight) return -1;
    if (!b.blockHeight) return 1;
    return b.blockHeight - a.blockHeight;
};

const alreadyAdded = (draft: State, transaction: WalletAccountTransaction) => {
    // two txs may have same id if they belong to two different accounts
    return draft.transactions.find(
        t => t.txid === transaction.txid && t.accountDescriptor === transaction.accountDescriptor,
    );
};

const add = (draft: State, transactions: WalletAccountTransaction[]) => {
    transactions.forEach(transaction => {
        if (!alreadyAdded(draft, transaction)) {
            draft.transactions.push(transaction);
        }
    });
    draft.transactions.sort(sortByBlockHeight);
};

export default (state: State = initialState, action: Action): State => {
    return produce(state, draft => {
        switch (action.type) {
            case TRANSACTION.ADD:
                add(draft, action.transactions);
                break;
            case TRANSACTION.REMOVE:
                draft.transactions.splice(
                    draft.transactions.findIndex(tx => tx.txid === action.txId),
                    1,
                );
                break;
            case TRANSACTION.UPDATE:
                update(draft, action);
                break;
            case TRANSACTION.FETCH_INIT:
                draft.isLoading = true;
                break;
            case TRANSACTION.FETCH_SUCCESS:
                add(draft, action.transactions);
                draft.isLoading = false;
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
