import { isAnyOf } from '@reduxjs/toolkit';

import {
    createWeakMapSelector,
    returnStableArrayIfEmpty,
    createReducerWithExtraDeps,
} from '@suite-common/redux-utils';
import { Account, WalletAccountTransaction, AccountKey } from '@suite-common/wallet-types';
import {
    findTransaction,
    getConfirmations,
    isPending,
    getEverstakePool,
    isClaimTx,
    isStakeTx,
    isStakeTypeTx,
    isUnstakeTx,
} from '@suite-common/wallet-utils';
import {
    getIsPhishingTransaction,
    TokenDefinitionsRootState,
} from '@suite-common/token-definitions';
import { selectNetworkTokenDefinitions } from '@suite-common/token-definitions/src/tokenDefinitionsSelectors';

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
import { AccountsRootState, selectAccountByKey } from '../accounts/accountsReducer';

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
            // We need to override types because there could be nulls/undefined in transactions array because of pagination
            // This should be fixed in TransactionsState but it will throw lot of errors then in desktop Suite
            transactions: { [key: AccountKey]: (WalletAccountTransaction | null | undefined)[] };
        };
    };
} & AccountsRootState;

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

const createMemoizedSelector = createWeakMapSelector.withTypes<
    TransactionsRootState & AccountsRootState
>();

export const selectIsLoadingAccountTransactions = (
    state: TransactionsRootState,
    accountKey: AccountKey | null,
) => state.wallet.transactions.fetchStatusDetail?.[accountKey ?? '']?.status === 'loading';

export const selectTransactions = (state: TransactionsRootState) =>
    state.wallet.transactions.transactions;

export const selectAreAllTransactionsLoaded = (
    state: TransactionsRootState,
    accountKey: AccountKey | null,
) => state.wallet.transactions.fetchStatusDetail?.[accountKey ?? '']?.areAllTransactionsLoaded;

const EMPTY_STABLE_TRANSACTIONS: WalletAccountTransaction[] = [];
/**
 * The list is not sorted here because it may contain null values as placeholders
 * for transactions that have not been fetched yet. (This affects pagination.)
 * !!! Use this selector only if you explicitly needs that null placeholder values !!!
 */
export const selectAccountTransactionsWithNulls = (
    state: TransactionsRootState,
    accountKey: AccountKey | null,
) => state.wallet.transactions.transactions[accountKey ?? ''] ?? EMPTY_STABLE_TRANSACTIONS;

export const selectAccountTransactions = createMemoizedSelector(
    [selectAccountTransactionsWithNulls],
    transactions => returnStableArrayIfEmpty(transactions.filter(t => !!t)),
);

export const selectPendingAccountAddresses = createMemoizedSelector(
    [selectAccountTransactions],
    transactions => {
        const pendingAddresses: string[] = [];
        const pendingTxs = transactions.filter(isPending);
        pendingTxs.forEach(t =>
            t.targets.forEach(target =>
                target.addresses?.forEach(a => pendingAddresses.unshift(a)),
            ),
        );

        return returnStableArrayIfEmpty(pendingAddresses);
    },
);

export const selectAllPendingTransactions = createMemoizedSelector(
    [selectTransactions],
    transactions =>
        Object.keys(transactions).reduce(
            (response, accountKey) => {
                response[accountKey] = (transactions[accountKey] ?? []).filter(isPending);

                return response;
            },
            {} as typeof transactions,
        ),
);

export const selectTransactionByAccountKeyAndTxid = createMemoizedSelector(
    [selectAccountTransactions, (_state, _accountKey: AccountKey | null, txid: string) => txid],
    (transactions, txid) => {
        const transaction = transactions.find(tx => tx?.txid === txid);

        return transaction ?? null;
    },
);

export const selectTransactionBlockTimeById = createMemoizedSelector(
    [selectTransactionByAccountKeyAndTxid],
    transaction => (transaction?.blockTime ? transaction.blockTime * 1000 : null),
);

export const selectTransactionTargets = createMemoizedSelector(
    [selectTransactionByAccountKeyAndTxid],
    transaction => transaction?.targets,
);

export const selectTransactionFirstTargetAddress = createMemoizedSelector(
    [selectTransactionTargets],
    targets => targets?.[0]?.addresses?.[0],
);

export const selectIsTransactionPending = createMemoizedSelector(
    [selectTransactionByAccountKeyAndTxid],
    transaction => (transaction ? isPending(transaction) : false),
);

export const selectTransactionConfirmations = (
    state: TransactionsRootState & BlockchainRootState & AccountsRootState,
    txid: string,
    accountKey: AccountKey,
) => {
    const transaction = selectTransactionByAccountKeyAndTxid(state, accountKey, txid);
    if (!transaction) return 0;

    const blockchainHeight = selectBlockchainHeightBySymbol(state, transaction.symbol);

    return getConfirmations(transaction, blockchainHeight);
};

export const selectIsPhishingTransaction = (
    state: TokenDefinitionsRootState & TransactionsRootState & AccountsRootState,
    txid: string,
    accountKey: AccountKey,
) => {
    const transaction = selectTransactionByAccountKeyAndTxid(state, accountKey, txid);

    if (!transaction) return false;

    const tokenDefinitions = selectNetworkTokenDefinitions(state, transaction.symbol);

    if (!tokenDefinitions) return false;

    return getIsPhishingTransaction(transaction, tokenDefinitions);
};

export const selectAccountStakeTypeTransactions = createMemoizedSelector(
    [selectAccountTransactions],
    transactions =>
        returnStableArrayIfEmpty(
            transactions.filter(tx => isStakeTypeTx(tx?.ethereumSpecific?.parsedData?.methodId)),
        ),
);

export const selectAccountStakeTransactions = createMemoizedSelector(
    [selectAccountTransactions],
    transactions =>
        returnStableArrayIfEmpty(
            transactions.filter(tx => isStakeTx(tx?.ethereumSpecific?.parsedData?.methodId)),
        ),
);

export const selectAccountUnstakeTransactions = createMemoizedSelector(
    [selectAccountTransactions],
    transactions =>
        returnStableArrayIfEmpty(
            transactions.filter(tx => isUnstakeTx(tx?.ethereumSpecific?.parsedData?.methodId)),
        ),
);

export const selectAccountClaimTransactions = createMemoizedSelector(
    [selectAccountTransactions],
    transactions =>
        returnStableArrayIfEmpty(
            transactions.filter(tx => isClaimTx(tx?.ethereumSpecific?.parsedData?.methodId)),
        ),
);

export const selectAccountHasStaked = createMemoizedSelector(
    [selectAccountStakeTransactions, selectAccountByKey],
    (stakeTxs, account) => {
        if (!account) return false;

        return stakeTxs.length > 0 || !!getEverstakePool(account);
    },
);

export const selectAssetAccountsThatStaked = (
    state: TransactionsRootState & AccountsRootState,
    accounts: Account[],
) => accounts.filter(account => selectAccountHasStaked(state, account.key));

export const selectAccountTransactionsFetchStatus = (
    state: TransactionsRootState,
    accountKey: AccountKey,
) => state.wallet.transactions.fetchStatusDetail?.[accountKey];

export const selectAccountTotalTransactions = createMemoizedSelector(
    [selectAccountByKey],
    account => account?.history.total ?? 0,
);

export const selectAreAllAccountTransactionsLoaded = createMemoizedSelector(
    [
        selectAccountTransactions,
        selectAccountTotalTransactions,
        selectAccountTransactionsFetchStatus,
    ],
    (transactions, accountTotalTransactions, fetchStatusDetail) => {
        const areAllTransactionsLoaded = !!fetchStatusDetail?.areAllTransactionsLoaded;
        if (areAllTransactionsLoaded) return true;

        return transactions.length >= accountTotalTransactions;
    },
);

export const selectIsPageAlreadyFetched = createMemoizedSelector(
    [
        selectAccountTransactionsWithNulls,
        (_state, _accountKey: AccountKey, page: number) => page,
        (_state, _accountKey: AccountKey, _page: number, perPage: number) => perPage,
    ],
    (transactions, page, perPage) => {
        const startIndex = (page - 1) * perPage;
        const stopIndex = startIndex + perPage;
        const txsForPage = transactions.slice(startIndex, stopIndex).filter(tx => !!tx?.txid);

        return txsForPage.length === perPage;
    },
);

export const selectAreAllAccountTransactionsLoadedFromNowUntilTimestamp = createMemoizedSelector(
    [
        selectAreAllAccountTransactionsLoaded,
        selectAccountTransactions,
        (_state, _accountKey: AccountKey, timestamp: number) => timestamp,
    ],
    (areAllTransactionsLoaded, transactions, timestamp) => {
        if (areAllTransactionsLoaded) return true;
        const lastTransaction = transactions[transactions.length - 1];

        return lastTransaction?.blockTime && lastTransaction.blockTime < timestamp;
    },
);

export const selectAccountTransactionsFromNowUntilTimestamp = createMemoizedSelector(
    [selectAccountTransactions, (_state, _accountKey: AccountKey, timestamp: number) => timestamp],
    (transactions, timestamp) =>
        returnStableArrayIfEmpty(
            transactions.filter(tx => tx.blockTime && tx.blockTime >= timestamp),
        ),
);
