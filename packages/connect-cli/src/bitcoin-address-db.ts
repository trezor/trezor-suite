import { createHash } from 'crypto';

import Database from 'better-sqlite3';

import type { AddressEntry, AddressLookupProvider, AddressMetadata, AllEntriesRow, TreeState } from '@trezor/connect';

type AddressRow = { address: string; network_symbol: string; data: string; counter: number };
type TreeStateRow = { root: string; counter: number };

const parseRow = (row: AddressRow): AddressEntry => ({
    metadata: JSON.parse(row.data) as AddressMetadata,
    counter: row.counter ?? 0,
});

export class BitcoinAddressDb implements AddressLookupProvider {
    private db: Database.Database;

    constructor(dbPath: string) {
        this.db = new Database(dbPath);
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS addresses (
                address        TEXT NOT NULL,
                network_symbol TEXT NOT NULL,
                counter        INTEGER NOT NULL DEFAULT 0,
                data           TEXT NOT NULL,
                PRIMARY KEY (address, network_symbol)
            );
            CREATE TABLE IF NOT EXISTS tree_state (
                id      INTEGER PRIMARY KEY CHECK (id = 1),
                root    TEXT NOT NULL,
                counter INTEGER NOT NULL DEFAULT 0
            );
        `);
        this._migrate();
    }

    private _migrate(): void {
        const cols = (this.db.pragma('table_info(addresses)') as { name: string }[]).map(c => c.name);
        // proof was stored in earlier versions — drop it; proof is now computed from the MPT.
        if (!cols.includes('counter')) {
            this.db.exec(`ALTER TABLE addresses ADD COLUMN counter INTEGER NOT NULL DEFAULT 0`);
        }
        if (cols.includes('proof')) {
            // SQLite doesn't support DROP COLUMN before 3.35; recreate the table instead.
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS addresses_new (
                    address        TEXT NOT NULL,
                    network_symbol TEXT NOT NULL,
                    counter        INTEGER NOT NULL DEFAULT 0,
                    data           TEXT NOT NULL,
                    PRIMARY KEY (address, network_symbol)
                );
                INSERT INTO addresses_new (address, network_symbol, counter, data)
                    SELECT address, network_symbol, counter, data FROM addresses;
                DROP TABLE addresses;
                ALTER TABLE addresses_new RENAME TO addresses;
            `);
        }
    }

    lookup(address: string, networkSymbol: string): AddressEntry | null {
        const row = this.db
            .prepare('SELECT data, counter FROM addresses WHERE address = ? AND network_symbol = ?')
            .get(address, networkSymbol) as Pick<AddressRow, 'data' | 'counter'> | undefined;

        return row ? parseRow({ address, network_symbol: networkSymbol, ...row }) : null;
    }

    // Returns existing entry, or creates one with a default label and counter=0 on first access.
    // Default label format: label_<first 8 bytes of SHA-256 as 16 hex chars>
    lookupOrCreate(address: string, networkSymbol: string): AddressEntry {
        const existing = this.lookup(address, networkSymbol);
        if (existing !== null) return existing;

        const shortHash = createHash('sha256').update(address).digest('hex').slice(0, 16);
        const entry: AddressEntry = {
            metadata: { label: `label_${shortHash}` },
            counter: 0,
        };
        this.upsert(address, networkSymbol, entry);

        return entry;
    }

    upsert(address: string, networkSymbol: string, entry: AddressEntry): void {
        this.db
            .prepare(
                `INSERT INTO addresses (address, network_symbol, counter, data)
                 VALUES (?, ?, ?, ?)
                 ON CONFLICT(address, network_symbol) DO UPDATE SET
                     counter = excluded.counter,
                     data    = excluded.data`,
            )
            .run(address, networkSymbol, entry.counter, JSON.stringify(entry.metadata));
    }

    getAllEntries(): AllEntriesRow[] {
        const rows = this.db
            .prepare('SELECT address, network_symbol, counter, data FROM addresses')
            .all() as AddressRow[];

        return rows.map(r => ({
            address: r.address,
            networkSymbol: r.network_symbol,
            entry: parseRow(r),
        }));
    }

    getTreeState(): TreeState | null {
        const row = this.db
            .prepare('SELECT root, counter FROM tree_state WHERE id = 1')
            .get() as TreeStateRow | undefined;

        return row ? { root: row.root, counter: row.counter } : null;
    }

    setTreeState(state: TreeState): void {
        this.db
            .prepare(
                `INSERT INTO tree_state (id, root, counter) VALUES (1, ?, ?)
                 ON CONFLICT(id) DO UPDATE SET root = excluded.root, counter = excluded.counter`,
            )
            .run(state.root, state.counter);
    }

    close(): void {
        this.db.close();
    }
}
