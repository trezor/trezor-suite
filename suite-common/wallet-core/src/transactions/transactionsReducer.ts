import { memoizeWithArgs } from 'proxy-memoize';
import { isAnyOf } from '@reduxjs/toolkit';

import { Account, WalletAccountTransaction, AccountKey } from '@suite-common/wallet-types';
import {
    findTransaction,
    getConfirmations,
    isPending,
    getIsPhishingTransaction,
    getEverstakePool,
} from '@suite-common/wallet-utils';
import { isClaimTx, isStakeTx, isStakeTypeTx, isUnstakeTx } from '@suite-common/suite-utils';
import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { selectNetworkTokenDefinitions } from '@suite-common/token-definitions/src/tokenDefinitionsSelectors';
import { TokenDefinitionsRootState } from '@suite-common/token-definitions';

import { accountsActions } from '../accounts/accountsActions';
import { transactionsActions } from './transactionsActions';
import {
    selectBlockchainHeightBySymbol,
    BlockchainRootState,
} from '../blockchain/blockchainReducer';
import {
    fetchTransactionsPageThunk,
    fetchAllTransactionsForAccountThunk,
} from './transactionsThunks';

export type AccountTransactionsFetchStatusDetail =
    | {
          status: 'loading' | 'idle';
          error: null;
      }
    | {
          status: 'error';
          error: string;
      };

export type AccountTransactionsFetchAllStatus = {
    areAllTransactionsLoaded: boolean;
};

export interface TransactionsState {
    transactions: { [key: AccountKey]: WalletAccountTransaction[] };
    fetchStatusDetail: {
        [key: AccountKey]: AccountTransactionsFetchStatusDetail &
            Partial<AccountTransactionsFetchAllStatus>;
    };
}

export const transactionsInitialState: TransactionsState = {
    transactions: {},
    fetchStatusDetail: {},
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
                if (transactions) {
                    state.transactions[account.key] = transactions.filter(
                        tx => !txs.some(t => t.txid === tx?.txid),
                    );
                }
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
                    delete state.fetchStatusDetail[a.key];
                });
            })

            .addCase(fetchTransactionsPageThunk.fulfilled, (state, { meta }) => {
                state.fetchStatusDetail[meta.arg.accountKey] = {
                    ...state.fetchStatusDetail[meta.arg.accountKey],
                    status: 'idle',
                    error: null,
                };
            })
            .addCase(fetchAllTransactionsForAccountThunk.fulfilled, (state, { meta }) => {
                state.fetchStatusDetail[meta.arg.accountKey] = {
                    ...state.fetchStatusDetail[meta.arg.accountKey],
                    areAllTransactionsLoaded: true,
                };
            })
            .addMatcher(
                isAnyOf(
                    fetchTransactionsPageThunk.rejected,
                    fetchAllTransactionsForAccountThunk.rejected,
                ),
                (state, { meta, error }) => {
                    state.fetchStatusDetail[meta.arg.accountKey] = {
                        ...state.fetchStatusDetail[meta.arg.accountKey],
                        status: 'error',
                        error: error.toString(),
                    };
                },
            )
            .addMatcher(
                isAnyOf(
                    fetchTransactionsPageThunk.pending,
                    fetchAllTransactionsForAccountThunk.pending,
                ),
                (state, { meta }) => {
                    if (!meta.arg.noLoading) {
                        state.fetchStatusDetail[meta.arg.accountKey] = {
                            ...state.fetchStatusDetail[meta.arg.accountKey],
                            status: 'loading',
                            error: null,
                        };
                    }
                },
            )
            .addMatcher(
                action => action.type === extra.actionTypes.storageLoad,
                extra.reducers.storageLoadTransactions,
            );
    },
);

// Used to define selector cache size
const EXPECTED_MAX_NUMBER_OF_ACCOUNTS = 50;

export const selectIsLoadingAccountTransactions = (
    state: TransactionsRootState,
    accountKey: AccountKey | null,
) => state.wallet.transactions.fetchStatusDetail?.[accountKey ?? '']?.status === 'loading';

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
            t.targets.forEach(target =>
                target.addresses?.forEach(a => pendingAddresses.unshift(a)),
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
            response[accountKey] = (transactions[accountKey] ?? []).filter(isPending);

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

export const selectIsPhishingTransaction = (
    state: TokenDefinitionsRootState & TransactionsRootState,
    txid: string,
    accountKey: AccountKey,
) => {
    const transaction = selectTransactionByTxidAndAccountKey(state, txid, accountKey);

    if (!transaction) return false;

    const tokenDefinitions = selectNetworkTokenDefinitions(state, transaction.symbol);

    if (!tokenDefinitions) return false;

    return getIsPhishingTransaction(transaction, tokenDefinitions);
};

export const selectAccountStakeTypeTransactions = (
    state: TransactionsRootState,
    accountKey: AccountKey,
) => {
    const transactions = selectAccountTransactions(state, accountKey);

    return transactions.filter(tx => isStakeTypeTx(tx?.ethereumSpecific?.parsedData?.methodId));
};

export const selectAccountStakeTransactions = (
    state: TransactionsRootState,
    accountKey: AccountKey,
) => {
    const transactions = selectAccountTransactions(state, accountKey);

    return transactions.filter(tx => isStakeTx(tx?.ethereumSpecific?.parsedData?.methodId));
};

export const selectAccountUnstakeTransactions = (
    state: TransactionsRootState,
    accountKey: AccountKey,
) => {
    const transactions = selectAccountTransactions(state, accountKey);

    return transactions.filter(tx => isUnstakeTx(tx?.ethereumSpecific?.parsedData?.methodId));
};

export const selectAccountClaimTransactions = (
    state: TransactionsRootState,
    accountKey: AccountKey,
) => {
    const transactions = selectAccountTransactions(state, accountKey);

    return transactions.filter(tx => isClaimTx(tx?.ethereumSpecific?.parsedData?.methodId));
};

export const selectAccountHasStaked = (state: TransactionsRootState, account: Account) => {
    const stakeTxs = selectAccountStakeTransactions(state, account.key);

    return stakeTxs.length > 0 || !!getEverstakePool(account);
};

export const selectAccountTransactionsFetchStatus = (
    state: TransactionsRootState,
    accountKey: AccountKey,
) => state.wallet.transactions.fetchStatusDetail?.[accountKey];

export const selectAreAllAccountTransactionsLoaded = (
    state: TransactionsRootState,
    accountKey: AccountKey,
) => !!state.wallet.transactions.fetchStatusDetail?.[accountKey]?.areAllTransactionsLoaded;
