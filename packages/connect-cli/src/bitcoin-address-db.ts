import { createHash } from 'crypto';

import Database from 'better-sqlite3';

import type { AddressLookupProvider, AddressMetadata } from '@trezor/connect';

type AddressRow = { data: string };

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

    lookup(address: string, networkSymbol: string): AddressMetadata | null {
        const row = this.db
            .prepare('SELECT data FROM addresses WHERE address = ? AND network_symbol = ?')
            .get(address, networkSymbol) as AddressRow | undefined;

        return row ? (JSON.parse(row.data) as AddressMetadata) : null;
    }

    // Returns existing metadata, or creates and stores a default label on first access.
    // Default label format: label_<first 8 bytes of SHA-256 as 16 hex chars>
    lookupOrCreate(address: string, networkSymbol: string): AddressMetadata {
        const existing = this.lookup(address, networkSymbol);
        if (existing !== null) return existing;

        const shortHash = createHash('sha256').update(address).digest('hex').slice(0, 16);
        const metadata: AddressMetadata = { label: `label_${shortHash}` };
        this.upsert(address, networkSymbol, metadata);

        return metadata;
    }

    upsert(address: string, networkSymbol: string, metadata: AddressMetadata): void {
        this.db
            .prepare(
                `INSERT INTO addresses (address, network_symbol, data)
                 VALUES (?, ?, ?)
                 ON CONFLICT(address, network_symbol) DO UPDATE SET data = excluded.data`,
            )
            .run(address, networkSymbol, JSON.stringify(metadata));
    }

    close(): void {
        this.db.close();
    }
}
