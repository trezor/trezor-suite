import { useEffect, useMemo, useState } from 'react';

import type { TransactionStoreQuery } from '@suite-common/transaction-store';
import { useServices } from '@trezor/dependency-injection';

import { injectEnsureTransactionStore } from './createEnsureTransactionStore';

/**
 * The query's rows, kept current, as Evolu's `useQuery`: the store runs the query in its worker
 * and sends new rows whenever a write changes them. A query asked for before starts from its last
 * rows while it refreshes; a new one from the previous query's rows, or `undefined` if none. Build
 * the query with `createTransactionStoreQuery`.
 */
export const useTransactionStoreQuery = <TRow>(
    query: TransactionStoreQuery<TRow>,
): TRow[] | undefined => {
    const { ensureTransactionStore } = useServices(injectEnsureTransactionStore);
    const { transactionStore, queryCache } = ensureTransactionStore();
    // The same query, however often it is rebuilt, keeps its subscription and its cached rows.
    const queryKey = JSON.stringify(query);
    const stableQuery = useMemo(
        (): TransactionStoreQuery<TRow> => JSON.parse(queryKey),
        [queryKey],
    );
    // The cache holds what this query's live subscription sent, so the rows are its own. An empty
    // result is not served from it: it may be from before a sync, and would show as no history.
    const getCachedRows = (key: string) => {
        const cachedRows = queryCache.get(key) as TRow[] | undefined;

        return cachedRows?.length === 0 ? undefined : cachedRows;
    };
    const [result, setResult] = useState(() => ({ queryKey, rows: getCachedRows(queryKey) }));

    useEffect(
        () =>
            transactionStore.subscribeQuery(stableQuery, rows => {
                queryCache.set(queryKey, rows);
                setResult({ queryKey, rows });
            }),
        [transactionStore, queryCache, stableQuery, queryKey],
    );

    if (result.queryKey === queryKey) return result.rows;

    return getCachedRows(queryKey) ?? result.rows;
};
