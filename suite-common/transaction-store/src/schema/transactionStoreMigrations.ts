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
    [
        // Every asset movement flat, so an asset's history (a token's, or the coin's) is a plain
        // indexed query instead of a scan of each transaction's JSON.
        `CREATE TABLE transfers (
            account_key TEXT NOT NULL,
            txid TEXT NOT NULL,
            idx INTEGER NOT NULL,
            kind TEXT NOT NULL,
            contract TEXT,
            direction TEXT NOT NULL,
            amount TEXT NOT NULL,
            decimals INTEGER,
            symbol TEXT,
            standard TEXT,
            from_address TEXT,
            to_address TEXT,
            block_height INTEGER,
            block_time INTEGER,
            PRIMARY KEY (account_key, txid, idx),
            FOREIGN KEY (account_key, txid)
                REFERENCES transactions (account_key, txid) ON DELETE CASCADE
        )`,
        'CREATE INDEX transfers_by_asset ON transfers (account_key, contract, block_time DESC)',
        // Rows stored before have no transfers. This is a local copy, so they are synced again.
        'DELETE FROM transactions',
        'DELETE FROM sync_state',
    ],
    [
        // The amount in units ("0.0012"), as people search for it; `amount` stays in base units.
        'ALTER TABLE transfers ADD COLUMN value TEXT',
        'DELETE FROM transactions',
        'DELETE FROM sync_state',
    ],
    [
        // What hiding suspicious transactions needs from the app, so that filter runs in SQL too.
        // The contracts of a network's token definitions, with the user's show/hide applied.
        `CREATE TABLE known_tokens (
            symbol TEXT NOT NULL,
            kind TEXT NOT NULL,
            contract TEXT NOT NULL,
            PRIMARY KEY (symbol, kind, contract)
        )`,
        // Listed once the app has fed the network's definitions; before, no token is "fake".
        'CREATE TABLE token_definition_networks (symbol TEXT PRIMARY KEY)',
    ],
    [
        // A sync in progress as data, so the app reads it with the rest; the engine clears it
        // on start, as a sync never outlives the worker.
        'ALTER TABLE sync_state ADD COLUMN is_syncing INTEGER NOT NULL DEFAULT 0',
    ],
];
