import produce from 'immer';
import { AccountTransaction } from 'trezor-connect';
import { ACCOUNT, TRANSACTION } from '@wallet-actions/constants';
import { getAccountKey, enhanceTransaction } from '@wallet-utils/accountUtils';
import { SETTINGS } from '@suite-config';
import { Account, WalletAction } from '@wallet-types';
import { Action } from '@suite-types';
import { STORAGE } from '@suite-actions/constants';

export interface WalletAccountTransaction extends AccountTransaction {
    id?: number;
    page?: number;
    deviceState: string;
    descriptor: string;
    symbol: string;
}

export interface State {
    transactions: { [key: string]: WalletAccountTransaction[] }; // object where a key is accountHash and a value is sparse array of fetched txs
    isLoading: boolean;
    error: string | null;
}

const initialState: State = {
    transactions: {},
    isLoading: false,
    error: null,
};

// const sortByBlockHeight = (a: WalletAccountTransaction, b: WalletAccountTransaction) => {
//     // if both are missing the blockHeight don't change their order
//     if (!a.blockHeight && !b.blockHeight) return 0;
//     // tx with no blockHeight comes first
//     if (!a.blockHeight) return -1;
//     if (!b.blockHeight) return 1;
//     return b.blockHeight - a.blockHeight;
// };

const initializeAccount = (draft: State, accountHash: string) => {
    // initialize an empty array at 'accountHash' index if not yet initialized
    if (!draft.transactions[accountHash]) {
        draft.transactions[accountHash] = [];
    }
};

const alreadyExists = (
    transactions: WalletAccountTransaction[],
    transaction: WalletAccountTransaction,
) => {
    // first we need to make sure that tx is not undefined, then check if txid matches
    return transactions.find(t => t && t.txid === transaction.txid);
};

const add = (draft: State, transactions: AccountTransaction[], account: Account, page?: number) => {
    const accountHash = getAccountKey(account.descriptor, account.symbol, account.deviceState);
    initializeAccount(draft, accountHash);
    const accountTxs = draft.transactions[accountHash];
    if (!accountTxs) return;

    transactions.forEach((tx, i) => {
        const enhancedTx = enhanceTransaction(tx, account);
        const existingTx = alreadyExists(accountTxs, enhancedTx);

        if (!existingTx) {
            // add a new transaction
            if (page) {
                // insert a tx object at correct index
                const txIndex = (page - 1) * SETTINGS.TXS_PER_PAGE + i;
                accountTxs[txIndex] = enhancedTx;
            } else {
                // no page arg, insert the tx at the beginning of the array
                accountTxs.unshift(enhancedTx);
            }
        } else {
            // update the transaction if conditions are met
            const existingTxIndex = accountTxs.findIndex(t => t && t.txid === existingTx.txid);
            // eslint-disable-next-line no-lonely-if
            if (
                (!existingTx.blockHeight && enhancedTx.blockHeight) ||
                (!existingTx.blockTime && enhancedTx.blockTime)
            ) {
                // pending tx got confirmed (blockHeight changed from undefined/0 to a number > 0)
                accountTxs[existingTxIndex] = { ...enhancedTx };
            }
        }
    });
};

export default (state: State = initialState, action: Action | WalletAction): State => {
    return produce(state, draft => {
        switch (action.type) {
            case STORAGE.LOADED:
                return action.payload.wallet.transactions;
            case ACCOUNT.CREATE:
                // gather transactions from account.create action
                add(draft, action.payload.history.transactions || [], action.payload, 1);
                break;
            case TRANSACTION.ADD:
                add(draft, action.transactions, action.account, action.page);
                break;
            case TRANSACTION.REMOVE:
                delete draft.transactions[
                    getAccountKey(
                        action.account.descriptor,
                        action.account.symbol,
                        action.account.deviceState,
                    )
                ];
                break;
            case TRANSACTION.UPDATE:
                // TODO
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
