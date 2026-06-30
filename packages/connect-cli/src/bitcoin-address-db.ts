import { createHash } from 'crypto';

import Database from 'better-sqlite3';

import type { AddressEntry, AddressLookupProvider, AddressMetadata } from '@trezor/connect';

type AddressRow = { data: string };

// Stored JSON shape: { metadata: AddressMetadata, proof: string[] }
// Backward-compat: if the row pre-dates AddressEntry, treat the whole blob as metadata with empty proof.
const parseRow = (raw: string): AddressEntry => {
    const parsed = JSON.parse(raw);
    if ('metadata' in parsed && 'proof' in parsed) {
        return parsed as AddressEntry;
    }

    // Legacy flat metadata blob (before AddressEntry was introduced)
    return { metadata: parsed as AddressMetadata, proof: [] };
};

export class BitcoinAddressDb implements AddressLookupProvider {
    private db: Database.Database;

    constructor(dbPath: string) {
        this.db = new Database(dbPath);
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS addresses (
                address        TEXT NOT NULL,
                network_symbol TEXT NOT NULL,
                data           TEXT NOT NULL,
                PRIMARY KEY (address, network_symbol)
            )
        `);
    }

    lookup(address: string, networkSymbol: string): AddressEntry | null {
        const row = this.db
            .prepare('SELECT data FROM addresses WHERE address = ? AND network_symbol = ?')
            .get(address, networkSymbol) as AddressRow | undefined;

        return row ? parseRow(row.data) : null;
    }

    // Returns existing entry, or creates one with a default label and empty proof on first access.
    // Default label format: label_<first 8 bytes of SHA-256 as 16 hex chars>
    lookupOrCreate(address: string, networkSymbol: string): AddressEntry {
        const existing = this.lookup(address, networkSymbol);
        if (existing !== null) return existing;

        const shortHash = createHash('sha256').update(address).digest('hex').slice(0, 16);
        const entry: AddressEntry = {
            metadata: { label: `label_${shortHash}` },
            proof: [],
        };
        this.upsert(address, networkSymbol, entry);

        return entry;
    }

    upsert(address: string, networkSymbol: string, entry: AddressEntry): void {
        this.db
            .prepare(
                `INSERT INTO addresses (address, network_symbol, data)
                 VALUES (?, ?, ?)
                 ON CONFLICT(address, network_symbol) DO UPDATE SET data = excluded.data`,
            )
            .run(address, networkSymbol, JSON.stringify(entry));
    }

    close(): void {
        this.db.close();
    }
}
