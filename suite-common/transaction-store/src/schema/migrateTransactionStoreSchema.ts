import { type Result, err, ok } from '@trezor/type-utils';

import { TRANSACTION_STORE_MIGRATIONS } from './transactionStoreMigrations';
import { runInSqliteTransaction } from '../sqlite/runInSqliteTransaction';
import type { TransactionStoreSqliteDep } from '../sqlite/transactionStoreSqlite';

export type MigrateTransactionStoreSchemaError = { type: 'SchemaFromNewerVersion' };

export const migrateTransactionStoreSchema = (
    deps: TransactionStoreSqliteDep,
): Result<void, MigrateTransactionStoreSchemaError> => {
    // Cascading deletes of an account's rows rely on it, and SQLite keeps it off per connection.
    deps.sqlite.exec({ sql: 'PRAGMA foreign_keys = ON', parameters: [] });

    const version =
        deps.sqlite.exec<{ user_version: number }>({ sql: 'PRAGMA user_version', parameters: [] })
            .rows[0]?.user_version ?? 0;

    if (version > TRANSACTION_STORE_MIGRATIONS.length) {
        return err({ type: 'SchemaFromNewerVersion' });
    }

    TRANSACTION_STORE_MIGRATIONS.slice(version).forEach((statements, index) => {
        runInSqliteTransaction(deps.sqlite, () => {
            statements.forEach(sql => deps.sqlite.exec({ sql, parameters: [] }));
            // The pragma takes no parameters; the value is a number from this file.
            deps.sqlite.exec({
                sql: `PRAGMA user_version = ${version + index + 1}`,
                parameters: [],
            });
        });
    });

    return ok();
};
