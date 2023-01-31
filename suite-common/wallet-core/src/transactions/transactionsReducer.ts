import { memoizeWithArgs } from 'proxy-memoize';

import { Account, WalletAccountTransaction, AccountKey } from '@suite-common/wallet-types';
import { findTransaction, isPending } from '@suite-common/wallet-utils';
import { createReducerWithExtraDeps } from '@suite-common/redux-utils';

import { fiatRatesActions } from '../fiat-rates/fiatRatesActions';
import { accountsActions } from '../accounts/accountsActions';
import { transactionsActions } from './transactionsActions';

export interface TransactionsState {
    isLoading: boolean;
    error: string | null;
    // Key is accountKey and value is sparse array of fetched txs
    transactions: { [key: AccountKey]: WalletAccountTransaction[] };
}

export const transactionsInitialState: TransactionsState = {
    isLoading: false,
    error: null,
    transactions: {},
};

export interface TransactionsRootState {
    wallet: {
        transactions: TransactionsState;
    };
}

const initializeAccount = (state: TransactionsState, accountKey: AccountKey) => {
    // initialize an empty array at 'accountKey' index if not yet initialized
    if (!state.transactions[accountKey]) {
        state.transactions[accountKey] = [];
    }
    return state.transactions[accountKey];
};

export const updateTransaction = (
    state: TransactionsState,
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
    transactionsInitialState,
    (builder, extra) => {
        builder
            .addCase(transactionsActions.fetchError, (state, { payload }) => {
                const { error } = payload;
                state.error = error;
                state.isLoading = false;
            })
            .addCase(transactionsActions.fetchInit, state => {
                state.isLoading = true;
            })
            .addCase(transactionsActions.fetchSuccess, state => {
                state.isLoading = false;
            })
            .addCase(transactionsActions.resetTransaction, (state, { payload }) => {
                const { account } = payload;
                delete state.transactions[account.key];
            })
            .addCase(transactionsActions.replaceTransaction, (state, { payload }) => {
                const { key, txid, tx } = payload;
                const accountTxs = initializeAccount(state, key);
                const index = accountTxs.findIndex(t => t && t.txid === txid);
                if (accountTxs[index]) accountTxs[index] = tx;
            })
            .addCase(transactionsActions.removeTransaction, (state, { payload }) => {
                const { account, txs } = payload;
                const transactions = state.transactions[account.key] || [];
                txs.forEach(tx => {
                    const index = transactions.findIndex(t => t.txid === tx.txid);
                    transactions.splice(index, 1);
                });
            })
            .addCase(transactionsActions.addTransaction, (state, { payload }) => {
                const { transactions, account, page, perPage } = payload;
                if (transactions.length < 1) return;
                initializeAccount(state, account.key);
                const accountTxs = state.transactions[account.key];

                if (!accountTxs) return;
                transactions.forEach((transaction, i) => {
                    // first we need to make sure that transaction is not undefined, then check if transactionid matches
                    const existingTx = findTransaction(transaction.txid, accountTxs);
                    if (!existingTx) {
                        // add a new transaction
                        if (page && perPage) {
                            // insert a tx object at correct index
                            // TODO settingsCommonConfig.TXS_PER_PAGE musi chodit z payloadu, jinak failuje (chodi do thunku, sem ne)
                            const txIndex = (page - 1) * perPage + i; // Needs to be same as TX_PER_PAGE
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
                            ((existingTx.blockHeight ?? 0) <= 0 &&
                                (transaction.blockHeight ?? 0) > 0) ||
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
            .addCase(fiatRatesActions.updateTransactionFiatRate, (state, { payload }) => {
                payload.forEach(u => {
                    updateTransaction(state, u.account, u.txid, u.updateObject);
                });
            })
            .addMatcher(
                action => action.type === extra.actionTypes.storageLoad,
                extra.reducers.storageLoadTransactions,
            );
    },
);

export const selectIsLoadingTransactions = (state: TransactionsRootState) =>
    state.wallet.transactions.isLoading;
export const selectTransactions = (state: TransactionsRootState) =>
    state.wallet.transactions.transactions;

/**
 * Returns transactions for the account specified by accountKey param.
 * The list is not sorted here because it may contain null values as placeholders
 * for transactions that have not been fetched yet. (This affects pagination.)
 */
export const selectAccountTransactions = (
    state: TransactionsRootState,
    accountKey: string | null,
) => state.wallet.transactions.transactions[accountKey ?? ''] ?? [];

export const selectPendingAccountAddresses = memoizeWithArgs(
    (state: TransactionsRootState, accountKey: AccountKey | null) => {
        const accountTransactions = selectAccountTransactions(state, accountKey);
        const pendingAddresses: string[] = [];
        const pendingTxs = accountTransactions.filter(isPending);
        pendingTxs.forEach(t =>
            t.targets.forEach(target =>
                target.addresses?.forEach(a => pendingAddresses.unshift(a)),
            ),
        );
        return pendingAddresses;
    },
);

// Note: Account key is passed because there can be duplication of TXIDs if self transaction was sent.
export const selectTransactionByTxidAndAccountKey = memoizeWithArgs(
    (state: TransactionsRootState, txid: string, accountKey: AccountKey) => {
        const transactions = selectAccountTransactions(state, accountKey);
        return transactions.find(tx => tx.txid === txid) ?? null;
    },
);

export const selectTransactionBlockTimeById = memoizeWithArgs(
    (state: TransactionsRootState, txid: string, accountKey: AccountKey) => {
        const transaction = selectTransactionByTxidAndAccountKey(state, txid, accountKey);
        if (transaction?.blockTime) {
            return transaction.blockTime * 1000;
        }
        return null;
    },
);
