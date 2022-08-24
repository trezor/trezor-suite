import { accountsActions } from 'suite-common/wallet-core/src/index';

import { Account, WalletAccountTransaction } from '@suite-common/wallet-types/libDev/src';
import { findTransaction } from '@suite-common/wallet-utils/libDev/src';
import { settingsCommonConfig } from '@suite-common/suite-config/libDev/src';
import { createReducerWithExtraDeps } from '@suite-common/redux-utils/libDev/src';

import { transactionActions } from './transactionActions';

export interface TransactionState {
    isLoading: boolean;
    error: string | null;
    // Key is accountHash and value is sparse array of fetched txs
    transactions: { [key: string]: WalletAccountTransaction[] };
}

export const initialState: TransactionState = {
    isLoading: false,
    error: null,
    transactions: {},
};

interface TransactionRootState {
    wallet: {
        transactions: TransactionState;
    };
}

const initializeAccount = (state: TransactionState, accountHash: string) => {
    // initialize an empty array at 'accountHash' index if not yet initialized
    if (!state.transactions[accountHash]) {
        state.transactions[accountHash] = [];
    }
    return state.transactions[accountHash];
};

export const updateTransaction = (
    state: TransactionState,
    account: Account,
    txid: string,
    updateObject: Partial<WalletAccountTransaction>,
) => {
    initializeAccount(state, account.key);
    const accountTxs = state.transactions[account.key];
    if (!accountTxs) return;

    const index = accountTxs.findIndex(t => t && t.txid === txid);
    accountTxs[index] = {
        ...accountTxs[index],
        ...updateObject,
    };
};

export const prepareTransactionsReducer = createReducerWithExtraDeps(
    initialState,
    (builder, extra) => {
        builder
            .addCase(transactionActions.fetchError, (state, { payload }) => {
                const { error } = payload;
                state.error = error;
                state.isLoading = false;
            })
            .addCase(transactionActions.fetchInit, state => {
                state.isLoading = true;
            })
            .addCase(transactionActions.fetchSuccess, state => {
                state.isLoading = false;
            })
            .addCase(transactionActions.resetTransaction, (state, { payload }) => {
                const { account } = payload;
                delete state.transactions[account.key];
            })
            .addCase(transactionActions.replaceTransaction, (state, { payload }) => {
                const { key, txid, tx } = payload;
                const accountTxs = initializeAccount(state, key);
                const index = accountTxs.findIndex(t => t && t.txid === txid);
                if (accountTxs[index]) accountTxs[index] = tx;
            })
            .addCase(transactionActions.removeTransaction, (state, { payload }) => {
                const { account, txs } = payload;
                const transactions = state.transactions[account.key] || [];
                txs.forEach(tx => {
                    const index = transactions.findIndex(t => t.txid === tx.txid);
                    transactions.splice(index, 1);
                });
            })
            .addCase(transactionActions.addTransaction, (state, { payload }) => {
                const { transactions, account, page } = payload;
                if (transactions.length < 1) return;
                initializeAccount(state, account.key);
                const accountTxs = state.transactions[account.key];

                if (!accountTxs) return;

                transactions.forEach((transaction, i) => {
                    // first we need to make sure that transaction is not undefined, then check if transactionid matches
                    const existingTx = findTransaction(transaction.txid, accountTxs);
                    if (!existingTx) {
                        // add a new transaction
                        if (page) {
                            // insert a tx object at correct index
                            const txIndex = (page - 1) * settingsCommonConfig.TXS_PER_PAGE + i;
                            accountTxs[txIndex] = transaction;
                        } else {
                            // no page arg, insert the tx at the beginning of the array
                            accountTxs.unshift(transaction);
                        }
                    } else {
                        // update the transaction if conditions are met
                        const existingTxIndex = accountTxs.findIndex(
                            t => t && t.txid === existingTx.txid,
                        );

                        if (
                            (!existingTx.blockHeight && transaction.blockHeight) ||
                            (!existingTx.blockTime && transaction.blockTime)
                        ) {
                            // pending tx got confirmed (blockHeight changed from undefined/0 to a number > 0)
                            accountTxs[existingTxIndex] = { ...transaction };
                        }
                    }
                });
            })
            .addCase(accountsActions.removeAccount, (state, { payload }) => {
                payload.forEach(a => {
                    delete state.transactions[a.key];
                });
            })
            .addMatcher(
                action => action.type === extra.actionTypes.storageLoad,
                extra.reducers.storageLoadTransactions,
            )
            .addMatcher(
                action => action.type === extra.actionTypes.fiatRateUpdate,
                extra.reducers.txFiatRateUpdate,
            );
    },
);

export const selectIsTransactionsLoading = (state: TransactionRootState) =>
    state.wallet.transactions.isLoading;
export const selectTransactionsError = (state: TransactionRootState) =>
    state.wallet.transactions.error;
export const selectTransactions = (state: TransactionRootState) =>
    state.wallet.transactions.transactions;
