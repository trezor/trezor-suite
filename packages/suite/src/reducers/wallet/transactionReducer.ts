import produce from 'immer';
import { AccountTransaction } from 'trezor-connect';
import { ACCOUNT, TRANSACTION } from '@wallet-actions/constants';
import { TransactionAction } from '@wallet-actions/transactionActions';
import { formatAmount } from '@wallet-utils/accountUtils';
import { Account, Action } from '@wallet-types';

export interface WalletAccountTransaction extends AccountTransaction {
    id?: number;
    page?: number;
    deviceState: string;
    descriptor: string;
    symbol: string;
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

// const sortByBlockHeight = (a: WalletAccountTransaction, b: WalletAccountTransaction) => {
//     // if both are missing the blockHeight don't change their order
//     if (!a.blockHeight && !b.blockHeight) return 0;
//     // tx with no blockHeight comes first
//     if (!a.blockHeight) return -1;
//     if (!b.blockHeight) return 1;
//     return b.blockHeight - a.blockHeight;
// };

const enhanceTransaction = (
    tx: AccountTransaction,
    account: Account,
    page?: number,
): WalletAccountTransaction => {
    return {
        descriptor: account.descriptor,
        deviceState: account.deviceState,
        symbol: account.symbol,
        ...tx,
        amount: formatAmount(tx.amount, account.symbol),
        fee: formatAmount(tx.fee, account.symbol),
        targets: tx.targets.map(tr => {
            if (typeof tr.amount === 'string') {
                return {
                    ...tr,
                    amount: formatAmount(tr.amount, account.symbol),
                };
            }
            return tr;
        }),
        page,
    };
};

const alreadyExists = (draft: State, transaction: WalletAccountTransaction) => {
    // two txs may have same id if they belong to two different accounts
    return draft.transactions.find(
        t => t.txid === transaction.txid && t.descriptor === transaction.descriptor,
    );
};

const add = (draft: State, transactions: AccountTransaction[], account: Account, page?: number) => {
    transactions.forEach(tx => {
        const enhancedTx = enhanceTransaction(tx, account, page);
        if (!alreadyExists(draft, enhancedTx)) {
            draft.transactions.push(enhancedTx);
        }
    });
};

export default (state: State = initialState, action: Action): State => {
    return produce(state, draft => {
        switch (action.type) {
            case ACCOUNT.CREATE:
                // gather transactions from account.create action
                add(draft, action.payload.history.transactions || [], action.payload, 1);
                break;
            // case TRANSACTION.ADD:
            //     add(draft, action.payload);
            //     break;
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
                add(draft, action.transactions, action.account, action.page);
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
