import { createEntityIndex } from '@suite-common/redux-utils';
import {
    type AccountKey,
    type WalletAccountTransaction,
    createAccountKey,
} from '@suite-common/wallet-types';

import { type TransactionsRootState } from './transactionsReducerTypes';

/**
 * A transaction's identity across the whole store.
 *
 * `txid` alone is not it: one transaction between two of the user's own accounts is stored under
 * both of them, as two entities with the same `txid` and different amounts from each account's
 * point of view. Which account it is filed under is therefore part of what identifies it — which
 * is why `findTransactions` has to return a list rather than a transaction.
 */
export type TransactionId = `${AccountKey}:${string}`;

export const getTransactionId = (accountKey: AccountKey, txid: string): TransactionId =>
    `${accountKey}:${txid}`;

/**
 * The same id, derived from the transaction alone.
 *
 * The index needs this: a caller holding a transaction must be able to find its place without
 * knowing which account the reducer filed it under. It reconstructs the reducer's own key, so the
 * two ways of naming a transaction cannot drift apart.
 */
export const getTransactionAccountKey = (transaction: WalletAccountTransaction): AccountKey =>
    createAccountKey({
        accountDescriptor: transaction.descriptor,
        networkSymbol: transaction.symbol,
        deviceStaticSessionId: transaction.deviceState,
    });

export const getTransactionIdFromTransaction = (
    transaction: WalletAccountTransaction,
): TransactionId => getTransactionId(getTransactionAccountKey(transaction), transaction.txid);

/**
 * Every transaction in the store, by id.
 *
 * The reducer keeps transactions as one array per account, with holes where pages have not been
 * fetched yet, so finding one means scanning an account — and finding one without knowing its
 * account means scanning all of them. This turns both into a map read.
 *
 * It is lazy and shared: see `createEntityIndex`.
 */
export const transactionsIndex = createEntityIndex({
    name: 'transactions',
    // The reducer replaces this object on every transaction write and keeps it otherwise, so its
    // identity is the whole "did anything change?" question.
    selectSource: (state: TransactionsRootState) => state.wallet.transactions.transactions,
    // One part per account, which is exactly what the reducer writes to: it replaces or mutates
    // one account's array at a time, so Immer leaves every other account's array identical and a
    // rebuild costs one account rather than the whole store.
    getParts: transactionsByAccount => Object.entries(transactionsByAccount),
    *getEntities(transactions) {
        for (const transaction of transactions) {
            // Pagination leaves holes for pages that have not been fetched.
            if (transaction) {
                yield transaction;
            }
        }
    },
    getId: getTransactionIdFromTransaction,
    groupBy: {
        /** An account's transactions, without going through its array. */
        byAccountKey: (transaction: WalletAccountTransaction) =>
            getTransactionAccountKey(transaction),
        /**
         * Every account that filed a transaction with this `txid` — the question
         * `findTransactions` answers by scanning every account in the store.
         */
        byTxid: (transaction: WalletAccountTransaction) => transaction.txid,
    },
});

/**
 * The transactions of one account, in the order the reducer holds them.
 *
 * Replaces reading the account's array out of the store, and is stable in a way that read is not:
 * the same array until this account's transactions themselves change.
 */
export const selectAccountTransactionsFromIndex = (
    state: TransactionsRootState,
    accountKey: AccountKey,
) => transactionsIndex.getBy(state, 'byAccountKey', accountKey);

/** The same, as ids, for a list that would rather each row watched its own transaction. */
export const selectAccountTransactionIdsFromIndex = (
    state: TransactionsRootState,
    accountKey: AccountKey,
) => transactionsIndex.getIdsBy(state, 'byAccountKey', accountKey);

/**
 * Every account's copy of one transaction — both sides of a transfer between the user's own
 * accounts, and nothing else. This is what `findTransactions` walks the whole store to answer.
 */
export const selectTransactionsByTxid = (state: TransactionsRootState, txid: string) =>
    transactionsIndex.getBy(state, 'byTxid', txid);

export const selectTransactionIdsByTxid = (state: TransactionsRootState, txid: string) =>
    transactionsIndex.getIdsBy(state, 'byTxid', txid);

export const selectTransactionById = (state: TransactionsRootState, id: TransactionId) =>
    transactionsIndex.getById(state, id);

/**
 * The transaction an account filed under this `txid`, if it has one.
 *
 * Replaces scanning the account's array, and unlike that scan it does not need the array —
 * the caller's two identifiers are enough.
 */
export const selectTransactionByAccountKeyAndTxidFromIndex = (
    state: TransactionsRootState,
    accountKey: AccountKey,
    txid: string,
) => transactionsIndex.getById(state, getTransactionId(accountKey, txid));
