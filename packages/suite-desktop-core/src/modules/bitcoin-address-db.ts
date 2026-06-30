import Database from 'better-sqlite3';

// Extensible metadata stored as JSON — add fields without altering the DB schema.
// Future: replace JSON.stringify/parse with protobuf encode/decode and change column to BLOB.
export type AddressMetadata = {
    label?: string;
};

type AddressRow = { data: string };

export class BitcoinAddressDb {
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
