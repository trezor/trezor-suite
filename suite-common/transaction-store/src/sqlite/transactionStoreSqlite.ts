export type SqlValue = string | number | null;

export type SqlRow = Record<string, SqlValue>;

export type SqlQuery = {
    sql: string;
    parameters: ReadonlyArray<SqlValue>;
};

export type SqlExecResult<TRow extends SqlRow = SqlRow> = {
    rows: ReadonlyArray<TRow>;
    changes: number;
};

/**
 * Synchronous SQLite, one statement per call. Shaped after Evolu's `SqliteDriver`, so each
 * platform entry wraps its driver: `@evolu/web` (OPFS), `@evolu/react-native` (expo-sqlite)
 * or `@evolu/nodejs` (better-sqlite3).
 *
 * @serviceContract
 */
export type TransactionStoreSqlite = {
    exec: <TRow extends SqlRow = SqlRow>(query: SqlQuery) => SqlExecResult<TRow>;
};

export type TransactionStoreSqliteDep = {
    sqlite: TransactionStoreSqlite;
};
