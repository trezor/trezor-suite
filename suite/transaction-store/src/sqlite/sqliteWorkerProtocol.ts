import type { SqlQuery, SqlRow } from '@suite-common/transaction-store';

/** App → worker: one call of `TransactionStoreSqlite`. */
export type SqliteWorkerRequest = { id: number } & (
    | { type: 'exec'; query: SqlQuery }
    | { type: 'execBatch'; queries: ReadonlyArray<SqlQuery> }
    | { type: 'select'; query: SqlQuery }
);

/** Worker → app. A failure carries no detail; SQLite's message may quote the data. */
export type SqliteWorkerResponse =
    { id: number; isOk: true; rows: SqlRow[] } | { id: number; isOk: false };
