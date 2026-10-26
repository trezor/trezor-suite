import { freeze, isAnyOf, isDraft, original } from '@reduxjs/toolkit';

import type { AccountKey } from '@suite-common/wallet-types';
import { type AccountInfo } from '@trezor/connect';
import {
    type ActionTypesDep,
    type ReducersDep,
    createReducerWithExtraDeps,
} from '@trezor/redux-utils';

import { mergeTransactions } from './mergeTransactions';
import { transactionsActions } from './transactionsActions';
import type {
    AccountTransactionsHistoryStatus,
    TransactionsState,
} from './transactionsReducerTypes';
import {
    fetchAllTransactionsForAccountThunk,
    fetchTransactionsPageThunk,
    hasTransactionsPageAfter,
} from './transactionsThunks';
import { accountsActions } from '../accounts/accountsActions';

export const transactionsInitialState: TransactionsState = {
    transactions: {},
    phishing: {},
    fetchStatusDetail: {},
};

const initializeAccount = (state: TransactionsState, accountKey: AccountKey) => {
    // initialize an empty array at 'accountKey' index if not yet initialized
    if (!state.transactions[accountKey]) {
        state.transactions[accountKey] = [];
    }

    return state.transactions[accountKey];
};

/** What a fetched page adds to the account's history walk. Only pages fetched in order count. */
type GetHistoryStatusAfterPageParams = {
    status: Partial<AccountTransactionsHistoryStatus> | undefined;
    page: number;
    perPage: number;
    result: AccountInfo | 'ALREADY_FETCHED';
};

const getHistoryStatusAfterPage = ({
    status,
    page,
    perPage,
    result,
}: GetHistoryStatusAfterPageParams): Partial<AccountTransactionsHistoryStatus> => {
    const { fetchedPages } = status ?? {};
    const fetchedCount = fetchedPages?.perPage === perPage ? (fetchedPages?.count ?? 0) : 0;

    if (page > fetchedCount + 1) {
        return {};
    }

    return {
        fetchedPages: { count: Math.max(page, fetchedCount), perPage },
        ...(page >= fetchedCount &&
            !hasTransactionsPageAfter(result, page) && { areAllTransactionsLoaded: true }),
    };
};

export type TransactionsReducerDeps = ActionTypesDep<'storageLoad'> &
    ReducersDep<'storageLoadTransactions'>;

export const prepareTransactionsReducer = createReducerWithExtraDeps(
    transactionsInitialState,
    (builder, extra: TransactionsReducerDeps) => {
        builder
            .addCase(transactionsActions.resetTransaction, (state, { payload }) => {
                const { account } = payload;
                delete state.transactions[account.key];
                delete state.phishing[account.key];
            })
            .addCase(transactionsActions.replaceTransaction, (state, { payload }) => {
                const { key, txid, tx } = payload;
                const accountTxs = initializeAccount(state, key);
                const index = accountTxs.findIndex(t => t?.txid === txid);
                if (accountTxs[index]) accountTxs[index] = tx;
            })
            .addCase(transactionsActions.removeTransaction, (state, { payload }) => {
                const { account, txs } = payload;
                const removedTxids = new Set(txs.map(tx => tx.txid));

                const transactions = state.transactions[account.key];
                if (transactions) {
                    state.transactions[account.key] = transactions.filter(
                        tx => !tx || !removedTxids.has(tx.txid),
                    );
                }

                const phishing = state.phishing[account.key];
                if (phishing) {
                    state.phishing[account.key] = phishing.filter(txid => !removedTxids.has(txid));
                }
            })
            .addCase(transactionsActions.addTransaction, (state, { payload }) => {
                const { transactions, account, page, perPage } = payload;
                if (transactions.length < 1) return;
                const accountTxs = initializeAccount(state, account.key);

                if (!accountTxs) return;
                const nextTxs = mergeTransactions({
                    storedTxs: isDraft(accountTxs) ? original(accountTxs) : accountTxs,
                    transactions,
                    page,
                    perPage,
                });
                if (nextTxs) {
                    state.transactions[account.key] = freeze(nextTxs, true);
                }
            })
            .addCase(transactionsActions.markTransactionAsNotScam, (state, { payload }) => {
                const { key, txid, isMarkedAsNotScam } = payload;
                const transactionIdList = state.phishing[key] || [];

                if (isMarkedAsNotScam && !transactionIdList.includes(txid)) {
                    state.phishing[key] = [...transactionIdList, txid];
                } else if (!isMarkedAsNotScam && transactionIdList.includes(txid)) {
                    state.phishing[key] = transactionIdList.filter(
                        transactionId => transactionId !== txid,
                    );
                }
            })
            .addCase(accountsActions.removeAccount, (state, { payload }) => {
                payload.forEach(a => {
                    delete state.transactions[a.key];
                    delete state.phishing[a.key];
                    delete state.fetchStatusDetail[a.key];
                });
            })

            .addCase(fetchTransactionsPageThunk.fulfilled, (state, { meta, payload }) => {
                const { accountKey } = meta.arg;
                const detail = state.fetchStatusDetail[accountKey];

                state.fetchStatusDetail[accountKey] = {
                    ...detail,
                    status: 'idle',
                    error: null,
                    ...getHistoryStatusAfterPage({
                        status: detail,
                        page: meta.arg.page,
                        perPage: meta.arg.perPage,
                        result: payload,
                    }),
                };
            })
            .addCase(fetchAllTransactionsForAccountThunk.fulfilled, (state, { meta }) => {
                const { accountKey } = meta.arg;
                const previousDetail = state.fetchStatusDetail[accountKey];
                const updatedDetail = { ...previousDetail, areAllTransactionsLoaded: true };
                // @ts-expect-error: indexing with noUncheckedIndexedAccess widens fetchStatusDetail
                state.fetchStatusDetail[accountKey] = updatedDetail;
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
