import produce from 'immer';
import { ACCOUNT, TRANSACTION, FIAT_RATES } from '@wallet-actions/constants';
import { findTransaction } from '@wallet-utils/transactionUtils';
import { getAccountKey } from '@wallet-utils/accountUtils';
import { SETTINGS } from '@suite-config';
import { Account, WalletAction } from '@wallet-types';
import { Action } from '@suite-types';
import { STORAGE } from '@suite-actions/constants';
import { WalletAccountTransaction } from '@suite-common/wallet-types';

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

const initializeAccount = (draft: State, accountHash: string) => {
    // initialize an empty array at 'accountHash' index if not yet initialized
    if (!draft.transactions[accountHash]) {
        draft.transactions[accountHash] = [];
    }
    return draft.transactions[accountHash];
};

const update = (
    draft: State,
    account: Account,
    txid: string,
    updateObject: Partial<WalletAccountTransaction>,
) => {
    initializeAccount(draft, account.key);
    const accountTxs = draft.transactions[account.key];
    if (!accountTxs) return;

    const index = accountTxs.findIndex(t => t && t.txid === txid);
    accountTxs[index] = {
        ...accountTxs[index],
        ...updateObject,
    };
};

const replace = (draft: State, key: string, txid: string, tx: WalletAccountTransaction) => {
    const accountTxs = initializeAccount(draft, key);
    const index = accountTxs.findIndex(t => t && t.txid === txid);
    if (accountTxs[index]) accountTxs[index] = tx;
};

const add = (
    draft: State,
    transactions: WalletAccountTransaction[],
    account: Account,
    page?: number,
) => {
    if (transactions.length < 1) return;
    initializeAccount(draft, account.key);
    const accountTxs = draft.transactions[account.key];
    if (!accountTxs) return;

    transactions.forEach((tx, i) => {
        // first we need to make sure that tx is not undefined, then check if txid matches
        const existingTx = findTransaction(tx.txid, accountTxs);
        if (!existingTx) {
            // add a new transaction
            if (page) {
                // insert a tx object at correct index
                const txIndex = (page - 1) * SETTINGS.TXS_PER_PAGE + i;
                accountTxs[txIndex] = tx;
            } else {
                // no page arg, insert the tx at the beginning of the array
                accountTxs.unshift(tx);
            }
        } else {
            // update the transaction if conditions are met
            const existingTxIndex = accountTxs.findIndex(t => t && t.txid === existingTx.txid);
            // eslint-disable-next-line no-lonely-if
            if (
                (!existingTx.blockHeight && tx.blockHeight) ||
                (!existingTx.blockTime && tx.blockTime)
            ) {
                // pending tx got confirmed (blockHeight changed from undefined/0 to a number > 0)
                accountTxs[existingTxIndex] = { ...tx };
            }
        }
    });
};

const remove = (draft: State, account: Account, txs: WalletAccountTransaction[]) => {
    const transactions = draft.transactions[account.key] || [];
    txs.forEach(tx => {
        const index = transactions.findIndex(t => t.txid === tx.txid);
        transactions.splice(index, 1);
    });
};

const transactionReducer = (state: State = initialState, action: Action | WalletAction): State =>
    produce(state, draft => {
        switch (action.type) {
            case STORAGE.LOAD: {
                action.payload.txs.forEach(item => {
                    const k = getAccountKey(
                        item.tx.descriptor,
                        item.tx.symbol,
                        item.tx.deviceState,
                    );
                    if (!draft.transactions[k]) {
                        draft.transactions[k] = [];
                    }
                    draft.transactions[k][item.order] = item.tx;
                });
                break;
            }
            case ACCOUNT.REMOVE:
                action.payload.forEach(a => {
                    delete draft.transactions[a.key];
                });
                break;
            case TRANSACTION.ADD:
                add(draft, action.transactions, action.account, action.page);
                break;
            case TRANSACTION.REMOVE:
                remove(draft, action.account, action.txs);
                break;
            case TRANSACTION.RESET:
                delete draft.transactions[action.account.key];
                break;
            case FIAT_RATES.TX_FIAT_RATE_UPDATE:
                action.payload.forEach(u => {
                    update(draft, u.account, u.txid, u.updateObject);
                });
                break;
            case TRANSACTION.REPLACE:
                replace(draft, action.key, action.txid, action.tx);
                break;
            case TRANSACTION.FETCH_INIT:
                draft.isLoading = true;
                break;
            case TRANSACTION.FETCH_SUCCESS:
                draft.isLoading = false;
                break;
            case TRANSACTION.FETCH_ERROR:
                draft.error = action.error;
                draft.isLoading = false;
                break;
            // no default
        }
    });

export default transactionReducer;
