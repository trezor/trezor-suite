import { A, F, pipe } from '@mobily/ts-belt';
import { isAnyOf, isFulfilled } from '@reduxjs/toolkit';

import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { AccountKey } from '@suite-common/suite-types';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountTransaction } from '@trezor/connect';

import { transactionsActions } from './transactionsActions';
import { fetchTransactionsThunk } from './transactionsThunks';

// probably move to wallet-types
export type Txid = string;

interface AccountTransactionMeta {
    allTxids: Txid[];
    pages: Partial<{
        [page: number]: Txid[];
    }>;
}

export interface TransactionsState {
    isLoading: boolean;
    error: string | null;
    // consider using object with key txid instead of AccountTransaction[] should be faster
    transactions: Partial<Record<NetworkSymbol, AccountTransaction[]>>;
    accountsTransactions: Record<AccountKey, AccountTransactionMeta>;
}

export interface TransactionsRootState {
    wallet: {
        transactions: TransactionsState;
    };
}

const transactionsInitialState: TransactionsState = {
    transactions: {},
    error: null,
    isLoading: false,
    accountsTransactions: {},
};

const uniqTransactions = (transactions: AccountTransaction[]) =>
    pipe(
        transactions,
        A.uniqBy(t => t.txid),
        F.toMutable,
    );

export const prepareTransactionsReducer = createReducerWithExtraDeps(
    transactionsInitialState,
    builder => {
        builder
            .addCase(fetchTransactionsThunk.pending, state => {
                state.isLoading = true;
            })
            .addCase(fetchTransactionsThunk.rejected, (state, { payload }) => {
                state.error = (payload as Error).message;
                state.isLoading = false;
            })
            .addCase(transactionsActions.replaceTransaction, (state, { payload }) => {
                // TODO should be easy
            })
            .addCase(transactionsActions.removeTransaction, (state, { payload }) => {
                // TODO
                // we can easily remove txid reference from `accountsTransactions` but then we need to check also other accounts
                // if there is no other reference to the txid we can remove it from `transactions`
            })
            .addCase(transactionsActions.resetTransaction, (state, { payload }) => {
                // TODO
                // we can easily remove whole account from `accountTransactions` but then we need to check also other accounts
                // if there is no other reference to the txid we can remove it from `transactions`
            })
            .addMatcher(
                isAnyOf(
                    isFulfilled(fetchTransactionsThunk),
                    transactionsActions.addTransaction.match,
                ),
                (state, { payload }) => {
                    if (!payload) return;

                    const { networkSymbol, transactions, accountKey, page } = payload;
                    const existingTransactions = state.transactions[networkSymbol];
                    if (!existingTransactions) {
                        state.transactions[networkSymbol] = transactions;
                    } else {
                        state.transactions[networkSymbol] = uniqTransactions([
                            ...existingTransactions,
                            ...transactions,
                        ]);
                    }

                    const existingAccountTransactionsMeta = state.accountsTransactions[accountKey];

                    const addedTxids = transactions.map(t => t.txid);

                    if (!existingAccountTransactionsMeta) {
                        state.accountsTransactions[accountKey].allTxids = addedTxids;
                        if (page) {
                            state.accountsTransactions[accountKey].pages[page] = addedTxids;
                        }
                    } else {
                        const allTxids = A.uniq([
                            ...existingAccountTransactionsMeta.allTxids,
                            addedTxids,
                        ]) as Txid[];
                        state.accountsTransactions[accountKey].allTxids = allTxids;

                        if (page) {
                            state.accountsTransactions[accountKey].pages = {
                                ...existingAccountTransactionsMeta.pages,
                                [page]: addedTxids,
                            };
                        }
                    }

                    state.isLoading = false;
                },
            );
    },
);
