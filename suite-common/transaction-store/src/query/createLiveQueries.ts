import type { TransactionStoreQuery } from './transactionStoreDatabase';
import type { TransactionStoreSqliteDep } from '../sqlite/transactionStoreSqlite';
import type { Unsubscribe } from '../transactionStoreTypes';

export type LiveQueriesDeps = TransactionStoreSqliteDep;

export type LiveQueries = {
    /** Calls back with the rows now, and again whenever a write changes them. */
    subscribe: <TRow>(
        query: TransactionStoreQuery<TRow>,
        onRows: (rows: TRow[]) => void,
    ) => Unsubscribe;
    /** Something was written: re-runs every live query once the current writes are done. */
    invalidate: () => void;
    dispose: () => void;
};

type LiveQuery = {
    query: TransactionStoreQuery<unknown>;
    onRows: (rows: unknown[]) => void;
    /** The last rows sent, serialized, so unchanged results are not sent again. */
    lastRows: string | null;
};

/**
 * The queries the app keeps open. They are few (a page, its count, a sync status) and indexed, so
 * re-running all of them after each write costs less than working out which ones a write touched.
 * SQLite answers in the order asked, so an older result never lands after a newer one.
 */
export const createLiveQueries = (deps: LiveQueriesDeps): LiveQueries => {
    const liveQueries = new Set<LiveQuery>();
    let isRefreshScheduled = false;

    const refresh = async (liveQuery: LiveQuery) => {
        // A broken query sends nothing; the others still refresh.
        const rows = await deps.sqlite.select(liveQuery.query).catch(() => null);
        if (rows === null || !liveQueries.has(liveQuery)) return;

        const serializedRows = JSON.stringify(rows);
        if (serializedRows === liveQuery.lastRows) return;

        liveQuery.lastRows = serializedRows;
        liveQuery.onRows(rows);
    };

    return {
        subscribe: (query, onRows) => {
            const liveQuery: LiveQuery = {
                query,
                // Rows come back as the query's type; this only hands them over.
                onRows: onRows as LiveQuery['onRows'],
                lastRows: null,
            };
            liveQueries.add(liveQuery);
            void refresh(liveQuery);

            return () => {
                liveQueries.delete(liveQuery);
            };
        },

        invalidate: () => {
            if (isRefreshScheduled) return;

            isRefreshScheduled = true;
            queueMicrotask(() => {
                isRefreshScheduled = false;
                liveQueries.forEach(liveQuery => void refresh(liveQuery));
            });
        },

        dispose: () => liveQueries.clear(),
    };
};
