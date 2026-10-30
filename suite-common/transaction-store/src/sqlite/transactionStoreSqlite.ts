export type SqlValue = string | number | null;

export type SqlRow = Record<string, SqlValue>;

export type SqlQuery = {
    sql: string;
    parameters: ReadonlyArray<SqlValue>;
};

/**
 * SQLite somewhere else, e.g. in a worker, as Evolu runs it: on web the OPFS database is only
 * reachable from a worker. Each call is one message, and calls run in the order made.
 *
 * @serviceContract
 */
export type TransactionStoreSqlite = {
    /** Runs one statement. */
    exec: (query: SqlQuery) => Promise<SqlRow[]>;
    /** Runs the statements atomically, in one SQLite transaction. */
    execBatch: (queries: ReadonlyArray<SqlQuery>) => Promise<void>;
    /** Runs a query SQLite refuses to write in (`PRAGMA query_only`). */
    select: (query: SqlQuery) => Promise<SqlRow[]>;
};

export type TransactionStoreSqliteDep = {
    sqlite: TransactionStoreSqlite;
};
