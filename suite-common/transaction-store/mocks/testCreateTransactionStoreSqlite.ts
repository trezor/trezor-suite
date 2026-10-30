import {
    Name,
    type SafeSql,
    type SqliteQueryParameters,
    createRun,
    getOrThrow,
} from '@evolu/common';
import { installPolyfills } from '@evolu/common/polyfills';
import { createBetterSqliteDriver } from '@evolu/nodejs';

import type { TransactionStoreSqlite } from '../src/sqlite/transactionStoreSqlite';

type TestTransactionStoreSqlite = TransactionStoreSqlite & { dispose: () => void };

/**
 * The store on an in-memory better-sqlite3, through the same Evolu driver contract the platform
 * entries use, so the SQL is exercised by real SQLite.
 */
export const testCreateTransactionStoreSqlite = async (): Promise<TestTransactionStoreSqlite> => {
    installPolyfills();

    await using run = createRun();
    const driver = getOrThrow(
        await run(
            createBetterSqliteDriver(Name.orThrow('transactionStoreTest'), { mode: 'memory' }),
        ),
    );

    return {
        exec: query => {
            const result = driver.exec({
                sql: query.sql as SafeSql,
                // Evolu brands numbers as finite; the store only binds integers and timestamps.
                parameters: query.parameters as SqliteQueryParameters,
            });

            return { rows: result.rows as never, changes: result.changes };
        },
        dispose: () => driver[Symbol.dispose](),
    };
};
