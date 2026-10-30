import type { TransactionStoreSqlite } from './transactionStoreSqlite';

const exec = (sqlite: TransactionStoreSqlite, sql: string) => sqlite.exec({ sql, parameters: [] });

/** Runs the writes atomically; an unexpected failure rolls them back and propagates. */
export const runInSqliteTransaction = <T>(sqlite: TransactionStoreSqlite, write: () => T): T => {
    exec(sqlite, 'BEGIN');

    try {
        const result = write();
        exec(sqlite, 'COMMIT');

        return result;
    } catch (error) {
        exec(sqlite, 'ROLLBACK');

        throw error;
    }
};
