import { useEffect, useMemo, useRef } from 'react';

import {
    type Collection,
    type Query,
    createCollection,
    useCollectionQuery,
    useDebouncedValue,
} from '@suite-common/reactive-collection';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';

import { transactionMatchesAdvancedSearch } from './advancedSearchTransactions';
import { type SearchAccountLabels } from './searchLabels';

export type TransactionSearchArg = {
    accountLabels: SearchAccountLabels;
    search: string;
};

export type TransactionSearchCollection = {
    collection: Collection<WalletAccountTransaction>;
    search: Query<TransactionSearchArg, readonly WalletAccountTransaction[]>;
};

/**
 * Builds a reactive transaction collection plus an incremental advanced-search
 * query, wiring {@link transactionMatchesAdvancedSearch} into
 * `defineFilterQuery`.
 *
 * Because the collection is keyed by `txid` and unchanged transactions keep
 * their reference across `setAll`, the search predicate is re-evaluated only for
 * the transactions that actually changed.
 */
export const createTransactionSearchCollection = (): TransactionSearchCollection => {
    const collection = createCollection<WalletAccountTransaction>({ getId: t => t.txid });

    const search = collection.defineFilterQuery((transaction, arg: TransactionSearchArg) =>
        transactionMatchesAdvancedSearch(transaction, arg.accountLabels, arg.search),
    );

    return { collection, search };
};

export type UseTransactionSearchOptions = {
    /** Debounce the search string (the value being typed) by this many ms. */
    debounceMs?: number;
};

/**
 * Searches `transactions` by an advanced query string, returning the matching
 * transactions and re-rendering only when the matching set changes.
 *
 * The collection lifecycle is managed internally: it is created once, kept in
 * sync with `transactions` (reconciled by txid, so unchanged transactions keep
 * their reference and the predicate runs only for the ones that changed), and
 * seeded synchronously to avoid an empty first render. The search string is
 * debounced (when `debounceMs` is set) while transaction and label changes are
 * reflected immediately.
 */
export const useTransactionSearch = (
    transactions: readonly WalletAccountTransaction[],
    accountLabels: SearchAccountLabels,
    searchString: string,
    options?: UseTransactionSearchOptions,
): readonly WalletAccountTransaction[] => {
    const collectionRef = useRef<TransactionSearchCollection | null>(null);
    if (!collectionRef.current) {
        collectionRef.current = createTransactionSearchCollection();
        collectionRef.current.collection.setAll(transactions);
    }
    const { collection, search } = collectionRef.current;

    useEffect(() => {
        collection.setAll(transactions);
    }, [collection, transactions]);

    const debouncedSearch = useDebouncedValue(searchString, options?.debounceMs);
    const arg = useMemo(
        () => ({ accountLabels, search: debouncedSearch }),
        [accountLabels, debouncedSearch],
    );

    return useCollectionQuery(collection, search, arg);
};
