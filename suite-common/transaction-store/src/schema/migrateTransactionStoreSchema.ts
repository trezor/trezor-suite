import { type Result, err, ok } from '@trezor/type-utils';

import { TRANSACTION_STORE_MIGRATIONS } from './transactionStoreMigrations';
import type { TransactionStoreSqliteDep } from '../sqlite/transactionStoreSqlite';

export type MigrateTransactionStoreSchemaError = { type: 'SchemaFromNewerVersion' };

export const migrateTransactionStoreSchema = async (
    deps: TransactionStoreSqliteDep,
): Promise<Result<void, MigrateTransactionStoreSchemaError>> => {
    // Cascading deletes of an account's rows rely on it, and SQLite keeps it off per connection.
    await deps.sqlite.exec({ sql: 'PRAGMA foreign_keys = ON', parameters: [] });

    const [row] = await deps.sqlite.exec({ sql: 'PRAGMA user_version', parameters: [] });
    const version = typeof row?.user_version === 'number' ? row.user_version : 0;

    if (version > TRANSACTION_STORE_MIGRATIONS.length) {
        return err({ type: 'SchemaFromNewerVersion' });
    }

    for (const [index, statements] of TRANSACTION_STORE_MIGRATIONS.slice(version).entries()) {
        await deps.sqlite.execBatch([
            ...statements.map(sql => ({ sql, parameters: [] })),
            // The pragma takes no parameters; the value is a number from this file.
            { sql: `PRAGMA user_version = ${version + index + 1}`, parameters: [] },
        ]);
    }

    return ok();
};
