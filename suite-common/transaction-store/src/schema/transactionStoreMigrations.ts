/**
 * Each entry migrates the schema one version up; the database's `user_version` is how many have
 * been applied. Never edit a released entry, append a new one.
 */
export const TRANSACTION_STORE_MIGRATIONS: ReadonlyArray<ReadonlyArray<string>> = [
    [
        `CREATE TABLE accounts (
            account_key TEXT PRIMARY KEY,
            symbol TEXT NOT NULL,
            descriptor TEXT NOT NULL
        )`,
        `CREATE TABLE transactions (
            account_key TEXT NOT NULL REFERENCES accounts (account_key) ON DELETE CASCADE,
            txid TEXT NOT NULL,
            block_height INTEGER,
            block_time INTEGER,
            type TEXT NOT NULL,
            data TEXT NOT NULL,
            PRIMARY KEY (account_key, txid)
        )`,
        'CREATE INDEX transactions_by_time ON transactions (account_key, block_time DESC)',
        `CREATE TABLE sync_state (
            account_key TEXT PRIMARY KEY REFERENCES accounts (account_key) ON DELETE CASCADE,
            is_complete INTEGER NOT NULL DEFAULT 0,
            last_synced_at INTEGER,
            last_error TEXT
        )`,
    ],
];
