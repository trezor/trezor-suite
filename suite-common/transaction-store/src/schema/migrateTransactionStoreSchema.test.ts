import { migrateTransactionStoreSchema } from './migrateTransactionStoreSchema';
import { TRANSACTION_STORE_MIGRATIONS } from './transactionStoreMigrations';
import { testCreateTransactionStoreSqlite } from '../../mocks/testCreateTransactionStoreSqlite';
import type { TransactionStoreSqlite } from '../sqlite/transactionStoreSqlite';

const getUserVersion = (sqlite: TransactionStoreSqlite) =>
    sqlite.exec<{ user_version: number }>({ sql: 'PRAGMA user_version', parameters: [] }).rows[0]
        ?.user_version;

const getTableNames = (sqlite: TransactionStoreSqlite) =>
    sqlite
        .exec<{ name: string }>({
            sql: "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
            parameters: [],
        })
        .rows.map(row => row.name);

describe(migrateTransactionStoreSchema.name, () => {
    it('creates the schema on an empty database', async () => {
        const sqlite = await testCreateTransactionStoreSqlite();

        const result = migrateTransactionStoreSchema({ sqlite });

        expect(result.success).toBe(true);
        expect(getTableNames(sqlite)).toEqual([
            'accounts',
            'known_tokens',
            'sync_state',
            'token_definition_networks',
            'transactions',
            'transfers',
        ]);
        expect(getUserVersion(sqlite)).toBe(TRANSACTION_STORE_MIGRATIONS.length);
        sqlite.dispose();
    });

    it('leaves a database that is already up to date alone', async () => {
        const sqlite = await testCreateTransactionStoreSqlite();
        migrateTransactionStoreSchema({ sqlite });
        sqlite.exec({
            sql: "INSERT INTO accounts (account_key, symbol, descriptor) VALUES ('a', 'btc', 'xpub')",
            parameters: [],
        });

        const result = migrateTransactionStoreSchema({ sqlite });

        expect(result.success).toBe(true);
        expect(sqlite.exec({ sql: 'SELECT * FROM accounts', parameters: [] }).rows).toHaveLength(1);
        sqlite.dispose();
    });

    it('refuses a database written by a newer version, rather than corrupting it', async () => {
        const sqlite = await testCreateTransactionStoreSqlite();
        sqlite.exec({
            sql: `PRAGMA user_version = ${TRANSACTION_STORE_MIGRATIONS.length + 1}`,
            parameters: [],
        });

        const result = migrateTransactionStoreSchema({ sqlite });

        expect(result).toEqual({ success: false, error: { type: 'SchemaFromNewerVersion' } });
        sqlite.dispose();
    });
});
