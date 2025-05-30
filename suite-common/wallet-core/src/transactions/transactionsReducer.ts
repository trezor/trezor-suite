import { isAnyOf } from '@reduxjs/toolkit';

import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { Account, AccountKey, WalletAccountTransaction } from '@suite-common/wallet-types';
import { findTransaction } from '@suite-common/wallet-utils';

import { transactionsActions } from './transactionsActions';
import {
    fetchAllTransactionsForAccountThunk,
    fetchTransactionsPageThunk,
} from './transactionsThunks';
import { accountsActions } from '../accounts/accountsActions';
import { AccountsRootState } from '../accounts/accountsReducer';

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
