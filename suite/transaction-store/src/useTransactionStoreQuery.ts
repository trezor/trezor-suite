import { useEffect, useMemo, useState } from 'react';

import type { TransactionStoreQuery } from '@suite-common/transaction-store';
import { useServices } from '@trezor/dependency-injection';

import { injectEnsureTransactionStore } from './createEnsureTransactionStore';

export type TransactionStoreQueryResult<TRow> = {
    /** The latest rows; while a changed query loads, those of the previous one. */
    rows: TRow[] | undefined;
    /** The rows are not yet the current query's. */
    isPending: boolean;
};

/**
 * The query's rows, kept current: the store runs it in its worker and sends new rows whenever a
 * write changes them. Build the query with `transactionStoreDb` and `toTransactionStoreQuery`.
 */
export const useTransactionStoreQuery = <TRow>(
    query: TransactionStoreQuery<TRow>,
): TransactionStoreQueryResult<TRow> => {
    const { ensureTransactionStore } = useServices(injectEnsureTransactionStore);
    // The same query, however often it is rebuilt, keeps its subscription.
    const queryKey = JSON.stringify(query);
    const stableQuery = useMemo(
        (): TransactionStoreQuery<TRow> => JSON.parse(queryKey),
        [queryKey],
    );
    const [result, setResult] = useState<{ queryKey: string; rows: TRow[] }>();

    useEffect(
        () =>
            ensureTransactionStore().transactionStore.subscribeQuery(stableQuery, rows =>
                setResult({ queryKey, rows }),
            ),
        [ensureTransactionStore, stableQuery, queryKey],
    );

    return { rows: result?.rows, isPending: result?.queryKey !== queryKey };
};
