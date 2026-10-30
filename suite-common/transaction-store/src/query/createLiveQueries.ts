import type { TransactionStoreQuery } from './transactionStoreDatabase';
import type { TransactionStoreSqliteDep } from '../sqlite/transactionStoreSqlite';
import type { Unsubscribe } from '../transactionStoreTypes';

export type LiveQueriesDeps = TransactionStoreSqliteDep;

export type LiveQueries = {
    /** Runs the query read-only: SQLite itself refuses any write in it. */
    run: <TRow>(query: TransactionStoreQuery<TRow>) => TRow[];
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

const PRAGMA_QUERY_ONLY = (isOn: boolean) => ({
    sql: `PRAGMA query_only = ${isOn ? 1 : 0}`,
    parameters: [],
});

/**
 * The queries the app keeps open. They are few (a page, its count, a sync status) and indexed, so
 * re-running all of them after each write costs less than working out which ones a write touched.
 */
export const createLiveQueries = (deps: LiveQueriesDeps): LiveQueries => {
    const liveQueries = new Set<LiveQuery>();
    let isRefreshScheduled = false;

    const run = <TRow>(query: TransactionStoreQuery<TRow>): TRow[] => {
        // The store runs one thing at a time, so no write of its own falls in between.
        deps.sqlite.exec(PRAGMA_QUERY_ONLY(true));
        try {
            // The rows are what the query selects; its type says so.
            return deps.sqlite.exec(query).rows as TRow[];
        } finally {
            deps.sqlite.exec(PRAGMA_QUERY_ONLY(false));
        }
    };

    const refresh = (liveQuery: LiveQuery) => {
        let rows: unknown[];
        try {
            rows = run(liveQuery.query);
        } catch {
            // A broken query sends nothing; the others still refresh.
            return;
        }
        const serializedRows = JSON.stringify(rows);
        if (serializedRows === liveQuery.lastRows) return;

        liveQuery.lastRows = serializedRows;
        liveQuery.onRows(rows);
    };

    return {
        run,

        subscribe: (query, onRows) => {
            const liveQuery: LiveQuery = {
                query,
                // Rows come back as the query's type; this only hands them over.
                onRows: onRows as LiveQuery['onRows'],
                lastRows: null,
            };
            liveQueries.add(liveQuery);
            refresh(liveQuery);

            return () => {
                liveQueries.delete(liveQuery);
            };
        },

        invalidate: () => {
            if (isRefreshScheduled) return;

            isRefreshScheduled = true;
            queueMicrotask(() => {
                isRefreshScheduled = false;
                liveQueries.forEach(refresh);
            });
        },

        dispose: () => liveQueries.clear(),
    };
};
