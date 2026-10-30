import type { SqlQuery, SqlRow } from '@suite-common/transaction-store';

/** App → worker: one call of `TransactionStoreSqlite`. */
export type SqliteWorkerRequest = { id: number } & (
    | { type: 'exec'; query: SqlQuery }
    | { type: 'execBatch'; queries: ReadonlyArray<SqlQuery> }
    | { type: 'select'; query: SqlQuery }
    /** Closes the database and deletes it; every call after fails. */
    | { type: 'deleteDatabase' }
);

/** Worker → app. A failure carries no detail; SQLite's message may quote the data. */
export type SqliteWorkerResponse =
    { id: number; isOk: true; rows: SqlRow[] } | { id: number; isOk: false };
