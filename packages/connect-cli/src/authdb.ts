import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname } from 'path';

import type {
    AddressEntry,
    AddressLookupProvider,
    AddressMetadata,
    AllEntriesRow,
    TreeState,
} from '@trezor/connect';

export type TreeStateWithMac = TreeState & { mac: string | null; deviceId: string | null };

type AddressRow = {
    address: string;
    network_symbol: string;
    data: string;
    counter: number;
    mac: string | null;
    device_id: string | null;
};
type TreeStateRow = { root: string; counter: number; mac: string | null; device_id: string | null };

const parseRow = (row: AddressRow): AddressEntry => ({
    metadata: JSON.parse(row.data) as AddressMetadata,
    counter: row.counter ?? 0,
});

export class BitcoinAddressDb implements AddressLookupProvider {
    private db: Database.Database;

    constructor(dbPath: string) {
        mkdirSync(dirname(dbPath), { recursive: true });
        this.db = new Database(dbPath);
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS addresses (
                address        TEXT NOT NULL,
                network_symbol TEXT NOT NULL,
                counter        INTEGER NOT NULL DEFAULT 0,
                data           TEXT NOT NULL,
                mac            TEXT,
                device_id      TEXT,
                PRIMARY KEY (address, network_symbol)
            );
            CREATE TABLE IF NOT EXISTS tree_state (
                id        INTEGER PRIMARY KEY CHECK (id = 1),
                root      TEXT NOT NULL,
                counter   INTEGER NOT NULL DEFAULT 0,
                mac       TEXT,
                device_id TEXT
            );
        `);
    }

    lookup(address: string, networkSymbol: string): AddressEntry | null {
        const row = this.db
            .prepare(
                'SELECT data, counter, mac, device_id FROM addresses WHERE address = ? AND network_symbol = ?',
            )
            .get(address, networkSymbol) as
            | Pick<AddressRow, 'data' | 'counter' | 'mac' | 'device_id'>
            | undefined;

        return row ? parseRow({ address, network_symbol: networkSymbol, ...row }) : null;
    }

    lookupOrCreate(address: string, networkSymbol: string): AddressEntry {
        const existing = this.lookup(address, networkSymbol);
        if (existing) return existing;

        const entry: AddressEntry = { metadata: {}, counter: 0 };
        this.upsert(address, networkSymbol, entry);

        return entry;
    }

    lookupApproval(
        address: string,
        networkSymbol: string,
    ): { mac: string; deviceId: string } | null {
        const row = this.db
            .prepare(
                'SELECT mac, device_id FROM addresses WHERE address = ? AND network_symbol = ?',
            )
            .get(address, networkSymbol) as Pick<AddressRow, 'mac' | 'device_id'> | undefined;

        if (!row?.mac || row.device_id === null) return null;

        return { mac: row.mac, deviceId: row.device_id };
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

    setApproval(address: string, networkSymbol: string, mac: string, deviceId: string): void {
        this.db
            .prepare(
                `UPDATE addresses SET mac = ?, device_id = ?
                 WHERE address = ? AND network_symbol = ?`,
            )
            .run(mac, deviceId, address, networkSymbol);
    }

    getAllEntries(): AllEntriesRow[] {
        const rows = this.db
            .prepare('SELECT address, network_symbol, counter, data FROM addresses ORDER BY rowid')
            .all() as AddressRow[];

        return rows.map(r => ({
            address: r.address,
            networkSymbol: r.network_symbol,
            entry: parseRow(r),
        }));
    }

    getTreeState(): TreeStateWithMac | null {
        const row = this.db
            .prepare('SELECT root, counter, mac, device_id FROM tree_state WHERE id = 1')
            .get() as TreeStateRow | undefined;

        return row
            ? { root: row.root, counter: row.counter, mac: row.mac, deviceId: row.device_id }
            : null;
    }

    setTreeState(state: TreeState, mac?: string, deviceId?: string): void {
        this.db
            .prepare(
                `INSERT INTO tree_state (id, root, counter, mac, device_id) VALUES (1, ?, ?, ?, ?)
                 ON CONFLICT(id) DO UPDATE SET
                     root      = excluded.root,
                     counter   = excluded.counter,
                     mac       = excluded.mac,
                     device_id = excluded.device_id`,
            )
            .run(state.root, state.counter, mac ?? null, deviceId ?? null);
    }

    clearAll(): void {
        this.db.prepare('DELETE FROM addresses').run();
        this.db.prepare('DELETE FROM tree_state').run();
    }

    close(): void {
        this.db.close();
    }
}
