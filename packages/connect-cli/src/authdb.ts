import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname } from 'path';

import type { OfflineQueueEntry, OfflineQueueProvider } from '@trezor/authdb';
import type {
    AuthLabelApprovalProvider,
    AuthLabelEntry,
    AuthLabelLookupProvider,
    AuthLabelMetadata,
    AuthLabelRow,
    TreeState,
} from '@trezor/connect';

type SqliteAddressRow = {
    wallet_id: string;
    address: string;
    network_symbol: string;
    data: string;
    counter: number;
    mac: string | null;
    device_id: string | null;
};
type TreeStateRow = { root: string; counter: number; mac: string | null };
type SqliteQueueRow = {
    device_id: string;
    wallet_id: string;
    mac: string;
    sequence: number;
    address: string;
    old_value: string;
    new_value: string;
};

const parseQueueRow = (row: SqliteQueueRow): OfflineQueueEntry => ({
    deviceId: row.device_id,
    walletId: row.wallet_id,
    mac: row.mac,
    sequence: row.sequence,
    address: row.address,
    oldValue: row.old_value,
    newValue: row.new_value,
});

const parseRow = (row: SqliteAddressRow): AuthLabelEntry => ({
    metadata: JSON.parse(row.data) as AuthLabelMetadata,
    counter: row.counter ?? 0,
});

export class AuthLabelDb
    implements AuthLabelLookupProvider, AuthLabelApprovalProvider, OfflineQueueProvider
{
    private db: Database.Database;

    constructor(dbPath: string) {
        mkdirSync(dirname(dbPath), { recursive: true });
        this.db = new Database(dbPath);
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS addresses (
                wallet_id      TEXT NOT NULL,
                address        TEXT NOT NULL,
                network_symbol TEXT NOT NULL,
                counter        INTEGER NOT NULL DEFAULT 0,
                data           TEXT NOT NULL,
                mac            TEXT,
                device_id      TEXT,
                PRIMARY KEY (wallet_id, address, network_symbol)
            );
            CREATE TABLE IF NOT EXISTS tree_state (
                wallet_id TEXT PRIMARY KEY,
                root      TEXT NOT NULL,
                counter   INTEGER NOT NULL DEFAULT 0,
                mac       TEXT
            );
            CREATE TABLE IF NOT EXISTS auth_queue (
                device_id TEXT NOT NULL,
                wallet_id TEXT NOT NULL,
                mac       TEXT NOT NULL,
                sequence  INTEGER NOT NULL,
                address   TEXT NOT NULL,
                old_value TEXT NOT NULL,
                new_value TEXT NOT NULL,
                PRIMARY KEY (wallet_id, sequence)
            );
        `);
    }

    lookup(walletId: string, address: string, networkSymbol: string): AuthLabelEntry | null {
        const row = this.db
            .prepare(
                `SELECT data, counter, mac, device_id FROM addresses
                 WHERE wallet_id = ? AND address = ? AND network_symbol = ?`,
            )
            .get(walletId, address, networkSymbol) as
            | Pick<SqliteAddressRow, 'data' | 'counter' | 'mac' | 'device_id'>
            | undefined;

        return row
            ? parseRow({ wallet_id: walletId, address, network_symbol: networkSymbol, ...row })
            : null;
    }

    lookupOrCreate(walletId: string, address: string, networkSymbol: string): AuthLabelEntry {
        const existing = this.lookup(walletId, address, networkSymbol);
        if (existing) return existing;

        const entry: AuthLabelEntry = { metadata: {}, counter: 0 };
        this.upsert(walletId, address, networkSymbol, entry);

        return entry;
    }

    lookupApproval(
        walletId: string,
        address: string,
        networkSymbol: string,
    ): { mac: string; deviceId: string } | null {
        const row = this.db
            .prepare(
                `SELECT mac, device_id FROM addresses
                 WHERE wallet_id = ? AND address = ? AND network_symbol = ?`,
            )
            .get(walletId, address, networkSymbol) as
            | Pick<SqliteAddressRow, 'mac' | 'device_id'>
            | undefined;

        if (!row?.mac || row.device_id === null) return null;

        return { mac: row.mac, deviceId: row.device_id };
    }

    upsert(walletId: string, address: string, networkSymbol: string, entry: AuthLabelEntry): void {
        this.db
            .prepare(
                `INSERT INTO addresses (wallet_id, address, network_symbol, counter, data)
                 VALUES (?, ?, ?, ?, ?)
                 ON CONFLICT(wallet_id, address, network_symbol) DO UPDATE SET
                     counter = excluded.counter,
                     data    = excluded.data`,
            )
            .run(walletId, address, networkSymbol, entry.counter, JSON.stringify(entry.metadata));
    }

    setApproval(
        walletId: string,
        address: string,
        networkSymbol: string,
        mac: string,
        deviceId: string,
    ): void {
        this.db
            .prepare(
                `UPDATE addresses SET mac = ?, device_id = ?
                 WHERE wallet_id = ? AND address = ? AND network_symbol = ?`,
            )
            .run(mac, deviceId, walletId, address, networkSymbol);
    }

    getAllEntries(walletId: string): AuthLabelRow[] {
        const rows = this.db
            .prepare(
                `SELECT wallet_id, address, network_symbol, counter, data FROM addresses
                 WHERE wallet_id = ? ORDER BY rowid`,
            )
            .all(walletId) as SqliteAddressRow[];

        return rows.map(r => ({
            address: r.address,
            networkSymbol: r.network_symbol,
            entry: parseRow(r),
        }));
    }

    getTreeState(walletId: string): TreeState | null {
        const row = this.db
            .prepare('SELECT root, counter, mac FROM tree_state WHERE wallet_id = ?')
            .get(walletId) as TreeStateRow | undefined;

        return row ? { root: row.root, counter: row.counter, mac: row.mac ?? undefined } : null;
    }

    setTreeState(walletId: string, state: TreeState): void {
        this.db
            .prepare(
                `INSERT INTO tree_state (wallet_id, root, counter, mac) VALUES (?, ?, ?, ?)
                 ON CONFLICT(wallet_id) DO UPDATE SET
                     root    = excluded.root,
                     counter = excluded.counter,
                     mac     = excluded.mac`,
            )
            .run(walletId, state.root, state.counter, state.mac ?? null);
    }

    appendQueueEntries(entries: OfflineQueueEntry[]): void {
        const insert = this.db.prepare(
            `INSERT INTO auth_queue (device_id, wallet_id, mac, sequence, address, old_value, new_value)
             VALUES (@deviceId, @walletId, @mac, @sequence, @address, @oldValue, @newValue)
             ON CONFLICT(wallet_id, sequence) DO NOTHING`,
        );
        const insertAll = this.db.transaction((rows: OfflineQueueEntry[]) => {
            rows.forEach(row => insert.run(row));
        });
        insertAll(entries);
    }

    getQueueEntries(walletId: string): OfflineQueueEntry[] {
        const rows = this.db
            .prepare(
                `SELECT device_id, wallet_id, mac, sequence, address, old_value, new_value
                 FROM auth_queue WHERE wallet_id = ? ORDER BY sequence`,
            )
            .all(walletId) as SqliteQueueRow[];

        return rows.map(parseQueueRow);
    }

    clearQueueEntries(walletId: string, throughSequence: number): void {
        this.db
            .prepare('DELETE FROM auth_queue WHERE wallet_id = ? AND sequence <= ?')
            .run(walletId, throughSequence);
    }

    clearAll(): void {
        this.db.prepare('DELETE FROM addresses').run();
        this.db.prepare('DELETE FROM tree_state').run();
        this.db.prepare('DELETE FROM auth_queue').run();
    }

    private closed = false;

    // Idempotent: safe to call from both connect-cli's own bookkeeping and connect's
    // dispose lifecycle (TrezorConnect.dispose() / a provider being swapped out via
    // updateConnectSettings) without risking a double-close on the sqlite handle.
    close(): void {
        if (this.closed) return;
        this.closed = true;
        this.db.close();
    }

    dispose(): void {
        this.close();
    }
}
