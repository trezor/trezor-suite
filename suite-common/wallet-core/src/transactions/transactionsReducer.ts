import { memoizeWithArgs } from 'proxy-memoize';

import { Account, WalletAccountTransaction, AccountKey } from '@suite-common/wallet-types';
import { findTransaction, getConfirmations, isPending } from '@suite-common/wallet-utils';
import { getIsZeroValuePhishing } from '@suite-common/suite-utils';
import { createReducerWithExtraDeps } from '@suite-common/redux-utils';

import { accountsActions } from '../accounts/accountsActions';
import { transactionsActions } from './transactionsActions';
import {
    selectBlockchainHeightBySymbol,
    BlockchainRootState,
} from '../blockchain/blockchainReducer';

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

export type TransactionsRootState = {
    wallet: {
        transactions: TransactionsState & {
            // We need to override types because there could be nulls in transactions array because of pagination
            // This should be fixed in TransactionsState but it will throw lot of errors then in desktop Suite
            transactions: { [key: AccountKey]: (WalletAccountTransaction | null)[] };
        };
    };
};

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
    if (accountTxs[index]) {
        accountTxs[index] = {
            ...accountTxs[index]!,
            ...updateObject,
        };
    }
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
                const transactions = state.transactions[account.key];
                state.transactions[account.key] = transactions?.filter(
                    tx => !txs.some(t => t.txid === tx?.txid),
                );
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
                        const existingBlockHeight = existingTx.blockHeight ?? 0;
                        const incomingBlockHeight = transaction.blockHeight ?? 0;
                        const existingIsPending = existingBlockHeight <= 0;
                        const incomingIsPending = incomingBlockHeight <= 0;

                        if (
                            (existingIsPending && !incomingIsPending) ||
                            (existingIsPending === incomingIsPending &&
                                existingBlockHeight < incomingBlockHeight) ||
                            (existingIsPending === incomingIsPending &&
                                (existingTx.blockTime ?? 0) < (transaction.blockTime ?? 0)) ||
                            (existingIsPending && !existingTx.rbfParams && transaction.rbfParams) ||
                            (existingTx.deadline && !transaction.deadline)
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
            .addCase(transactionsActions.updateTransactionFiatRate, (state, { payload }) => {
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

// Used to define selector cache size
const EXPECTED_MAX_NUMBER_OF_ACCOUNTS = 50;

export const selectIsLoadingTransactions = (state: TransactionsRootState) =>
    state.wallet.transactions.isLoading;
export const selectTransactions = (state: TransactionsRootState) =>
    state.wallet.transactions.transactions;

/**
 * The list is not sorted here because it may contain null values as placeholders
 * for transactions that have not been fetched yet. (This affects pagination.)
 * !!! Use this selector only if you explicitly needs that null placeholder values !!!
 */
export const selectAccountTransactionsWithNulls = (
    state: TransactionsRootState,
    accountKey: AccountKey | null,
) => state.wallet.transactions.transactions[accountKey ?? ''] ?? [];

export const selectAccountTransactions = memoizeWithArgs(
    (state: TransactionsRootState, accountKey: AccountKey | null): WalletAccountTransaction[] => {
        const transactions = selectAccountTransactionsWithNulls(state, accountKey);
        return transactions.filter(t => t !== null);
    },
    { size: EXPECTED_MAX_NUMBER_OF_ACCOUNTS },
);

export const selectPendingAccountAddresses = memoizeWithArgs(
    (state: TransactionsRootState, accountKey: AccountKey | null) => {
        const accountTransactions = selectAccountTransactions(state, accountKey);
        const pendingAddresses: string[] = [];
        const pendingTxs = accountTransactions.filter(isPending);
        pendingTxs.forEach(t =>
            t.targets.forEach(
                target => target.addresses?.forEach(a => pendingAddresses.unshift(a)),
            ),
        );
        return pendingAddresses;
    },
    { size: EXPECTED_MAX_NUMBER_OF_ACCOUNTS },
);

export const selectAllPendingTransactions = (state: TransactionsRootState) => {
    const { transactions } = state.wallet.transactions;
    return Object.keys(transactions).reduce(
        (response, accountKey) => {
            response[accountKey] = transactions[accountKey].filter(isPending);
            return response;
        },
        {} as typeof transactions,
    );
};

// Note: Account key is passed because there can be duplication of TXIDs if self transaction was sent.
export const selectTransactionByTxidAndAccountKey = (
    state: TransactionsRootState,
    txid: string,
    accountKey: AccountKey,
) => {
    const transactions = selectAccountTransactions(state, accountKey);
    return transactions.find(tx => tx?.txid === txid) ?? null;
};

export const selectTransactionBlockTimeById = (
    state: TransactionsRootState,
    txid: string,
    accountKey: AccountKey,
) => {
    const transaction = selectTransactionByTxidAndAccountKey(state, txid, accountKey);
    if (transaction?.blockTime) {
        return transaction.blockTime * 1000;
    }
    return null;
};

export const selectTransactionTargets = (
    state: TransactionsRootState,
    txid: string,
    accountKey: AccountKey,
) => {
    const transaction = selectTransactionByTxidAndAccountKey(state, txid, accountKey);
    return transaction?.targets;
};

export const selectTransactionFirstTargetAddress = (
    state: TransactionsRootState,
    txid: string,
    accountKey: AccountKey,
) => {
    const transactionTargets = selectTransactionTargets(state, txid, accountKey);
    return transactionTargets?.[0]?.addresses?.[0];
};

export const selectIsTransactionPending = (
    state: TransactionsRootState,
    txid: string,
    accountKey: AccountKey,
): boolean => {
    const transaction = selectTransactionByTxidAndAccountKey(state, txid, accountKey);
    return transaction ? isPending(transaction) : false;
};

export const selectTransactionConfirmations = (
    state: TransactionsRootState & BlockchainRootState,
    txid: string,
    accountKey: AccountKey,
) => {
    const transaction = selectTransactionByTxidAndAccountKey(state, txid, accountKey);
    if (!transaction) return 0;

    const blockchainHeight = selectBlockchainHeightBySymbol(state, transaction.symbol);
    return getConfirmations(transaction, blockchainHeight);
};

export const selectIsTransactionZeroValuePhishing = (
    state: TransactionsRootState,
    txid: string,
    accountKey: AccountKey,
) => {
    const transaction = selectTransactionByTxidAndAccountKey(state, txid, accountKey);

    if (!transaction) return false;

    return getIsZeroValuePhishing(transaction);
};
