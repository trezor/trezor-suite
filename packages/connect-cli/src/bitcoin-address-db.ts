import { createHash } from 'crypto';

import Database from 'better-sqlite3';

import type { AddressEntry, AddressLookupProvider, AddressMetadata, MerkleProof, TreeState } from '@trezor/connect';

type AddressRow = { data: string; counter: number; proof: string };
type TreeStateRow = { root: string; counter: number };

const parseRow = (row: AddressRow): AddressEntry => ({
    metadata: JSON.parse(row.data) as AddressMetadata,
    counter: row.counter ?? 0,
    proof: row.proof ? (JSON.parse(row.proof) as MerkleProof) : [],
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
                proof          TEXT NOT NULL DEFAULT '[]',
                data           TEXT NOT NULL,
                PRIMARY KEY (address, network_symbol)
            );
            CREATE TABLE IF NOT EXISTS tree_state (
                id      INTEGER PRIMARY KEY CHECK (id = 1),
                root    TEXT NOT NULL,
                counter INTEGER NOT NULL DEFAULT 0
            );
        `);
    }

    lookup(address: string, networkSymbol: string): AddressEntry | null {
        const row = this.db
            .prepare('SELECT data, counter, proof FROM addresses WHERE address = ? AND network_symbol = ?')
            .get(address, networkSymbol) as AddressRow | undefined;

        return row ? parseRow(row) : null;
    }

    // Returns existing entry, or creates one with a default label, counter=0, and empty proof on first access.
    // Default label format: label_<first 8 bytes of SHA-256 as 16 hex chars>
    lookupOrCreate(address: string, networkSymbol: string): AddressEntry {
        const existing = this.lookup(address, networkSymbol);
        if (existing !== null) return existing;

        const shortHash = createHash('sha256').update(address).digest('hex').slice(0, 16);
        const entry: AddressEntry = {
            metadata: { label: `label_${shortHash}` },
            counter: 0,
            proof: [],
        };
        this.upsert(address, networkSymbol, entry);

        return entry;
    }

    upsert(address: string, networkSymbol: string, entry: AddressEntry): void {
        this.db
            .prepare(
                `INSERT INTO addresses (address, network_symbol, counter, proof, data)
                 VALUES (?, ?, ?, ?, ?)
                 ON CONFLICT(address, network_symbol) DO UPDATE SET
                     counter = excluded.counter,
                     proof   = excluded.proof,
                     data    = excluded.data`,
            )
            .run(address, networkSymbol, entry.counter, JSON.stringify(entry.proof), JSON.stringify(entry.metadata));
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
