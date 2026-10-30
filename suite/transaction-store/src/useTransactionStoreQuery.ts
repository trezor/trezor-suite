import { useEffect, useMemo, useState } from 'react';

import type { TransactionStoreQuery } from '@suite-common/transaction-store';
import { useServices } from '@trezor/dependency-injection';

import { injectEnsureTransactionStore } from './createEnsureTransactionStore';

/**
 * The query's rows, kept current, as Evolu's `useQuery`: the store runs the query in its worker
 * and sends new rows whenever a write changes them. `undefined` until the first rows arrive; while
 * a changed query loads, the previous one's. Build the query with `createTransactionStoreQuery`.
 */
export const useTransactionStoreQuery = <TRow>(
    query: TransactionStoreQuery<TRow>,
): TRow[] | undefined => {
    const { ensureTransactionStore } = useServices(injectEnsureTransactionStore);
    // The same query, however often it is rebuilt, keeps its subscription.
    const queryKey = JSON.stringify(query);
    const stableQuery = useMemo(
        (): TransactionStoreQuery<TRow> => JSON.parse(queryKey),
        [queryKey],
    );
    const [rows, setRows] = useState<TRow[]>();

    useEffect(
        () => ensureTransactionStore().transactionStore.subscribeQuery(stableQuery, setRows),
        [ensureTransactionStore, stableQuery],
    );

    return rows;
};
