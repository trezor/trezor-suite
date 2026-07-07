/* eslint-disable no-console -- verbose AuthDB diagnostics (dev/testing sqlite backend) */
/**
 * @trezor/authdb/storage/sqlite — better-sqlite3-backed reference implementation of the
 * storage-provider contracts. Isolated behind its own subpath so that importing the
 * contracts, /proof or /sync never pulls the native better-sqlite3 module (declared as an
 * optionalDependency). Used by connect-cli for dev/testing; suite-desktop will supply an
 * Evolu-backed implementation instead.
 */
import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname } from 'path';

import type {
    AuthConflictResolutionProvider,
    AuthHistoryProvider,
    AuthLabelApprovalProvider,
    AuthLabelLookupProvider,
    OfflineQueueProvider,
} from '../';
import type {
    AuthHistoryEntry,
    AuthLabelEntry,
    AuthLabelMetadata,
    AuthLabelRow,
    OfflineQueueEntry,
    SignedConflictResolution,
    TreeState,
} from '../../types';

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
    old_counter: number | null;
    new_counter: number;
};
type SqliteHistoryRow = {
    wallet_id: string;
    address: string;
    network_symbol: string;
    device_id: string;
    old_value: string;
    new_value: string;
    old_counter: number | null;
    new_counter: number | null;
    applied_at_root_counter: number;
};

const parseQueueRow = (row: SqliteQueueRow): OfflineQueueEntry => ({
    deviceId: row.device_id,
    walletId: row.wallet_id,
    mac: row.mac,
    sequence: row.sequence,
    address: row.address,
    oldValue: row.old_value,
    newValue: row.new_value,
    oldCounter: row.old_counter ?? undefined,
    newCounter: row.new_counter,
});

const parseHistoryRow = (row: SqliteHistoryRow): AuthHistoryEntry => ({
    walletId: row.wallet_id,
    address: row.address,
    networkSymbol: row.network_symbol,
    deviceId: row.device_id,
    oldValue: row.old_value,
    newValue: row.new_value,
    oldCounter: row.old_counter ?? undefined,
    newCounter: row.new_counter ?? undefined,
    appliedAtRootCounter: row.applied_at_root_counter,
});

const parseRow = (row: SqliteAddressRow): AuthLabelEntry => ({
    metadata: JSON.parse(row.data) as AuthLabelMetadata,
    counter: row.counter ?? 0,
});

export class AuthLabelDb
    implements
        AuthLabelLookupProvider,
        AuthLabelApprovalProvider,
        OfflineQueueProvider,
        AuthHistoryProvider,
        AuthConflictResolutionProvider
{
    private db: Database.Database;

    constructor(dbPath: string) {
        mkdirSync(dirname(dbPath), { recursive: true });
        this.db = new Database(dbPath);
        console.log('[AuthLabelDb] opened SQLite database:', dbPath);
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
                device_id   TEXT NOT NULL,
                wallet_id   TEXT NOT NULL,
                mac         TEXT NOT NULL,
                sequence    INTEGER NOT NULL,
                address     TEXT NOT NULL,
                old_value   TEXT NOT NULL,
                new_value   TEXT NOT NULL,
                old_counter INTEGER,
                new_counter INTEGER NOT NULL DEFAULT 0,
                PRIMARY KEY (wallet_id, sequence)
            );
            CREATE TABLE IF NOT EXISTS auth_history (
                wallet_id                TEXT NOT NULL,
                address                  TEXT NOT NULL,
                network_symbol           TEXT NOT NULL,
                device_id                TEXT NOT NULL,
                old_value                TEXT NOT NULL,
                new_value                TEXT NOT NULL,
                old_counter              INTEGER,
                new_counter              INTEGER,
                applied_at_root_counter  INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS auth_conflict_resolution (
                wallet_id            TEXT NOT NULL,
                address              TEXT NOT NULL,
                network_symbol       TEXT NOT NULL,
                sequence             INTEGER NOT NULL,
                resolved_old_value   TEXT NOT NULL,
                resolved_old_counter INTEGER NOT NULL,
                resolved_new_value   TEXT NOT NULL,
                resolved_new_counter INTEGER NOT NULL,
                mac                  TEXT NOT NULL,
                PRIMARY KEY (wallet_id, address, network_symbol, sequence)
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
            `INSERT INTO auth_queue
                (device_id, wallet_id, mac, sequence, address, old_value, new_value, old_counter, new_counter)
             VALUES (@deviceId, @walletId, @mac, @sequence, @address, @oldValue, @newValue, @oldCounter, @newCounter)
             ON CONFLICT(wallet_id, sequence) DO NOTHING`,
        );
        const insertAll = this.db.transaction((rows: OfflineQueueEntry[]) => {
            rows.forEach(row => insert.run({ ...row, oldCounter: row.oldCounter ?? null }));
        });
        insertAll(entries);
    }

    getQueueEntries(walletId: string): OfflineQueueEntry[] {
        const rows = this.db
            .prepare(
                `SELECT device_id, wallet_id, mac, sequence, address, old_value, new_value, old_counter, new_counter
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

    recordHistoryEntry(entry: AuthHistoryEntry): void {
        this.db
            .prepare(
                `INSERT INTO auth_history
                    (wallet_id, address, network_symbol, device_id, old_value, new_value,
                     old_counter, new_counter, applied_at_root_counter)
                 VALUES (@walletId, @address, @networkSymbol, @deviceId, @oldValue, @newValue,
                     @oldCounter, @newCounter, @appliedAtRootCounter)`,
            )
            .run({
                ...entry,
                oldCounter: entry.oldCounter ?? null,
                newCounter: entry.newCounter ?? null,
            });
    }

    getAddressHistory(walletId: string, address: string): AuthHistoryEntry[] {
        const rows = this.db
            .prepare(
                `SELECT wallet_id, address, network_symbol, device_id, old_value, new_value,
                        old_counter, new_counter, applied_at_root_counter
                 FROM auth_history WHERE wallet_id = ? AND address = ? ORDER BY rowid`,
            )
            .all(walletId, address) as SqliteHistoryRow[];

        return rows.map(parseHistoryRow);
    }

    getConflictResolution(
        walletId: string,
        address: string,
        networkSymbol: string,
        sequence: number,
    ): SignedConflictResolution | null {
        const row = this.db
            .prepare(
                `SELECT resolved_old_value, resolved_old_counter, resolved_new_value,
                        resolved_new_counter, mac
                 FROM auth_conflict_resolution
                 WHERE wallet_id = ? AND address = ? AND network_symbol = ? AND sequence = ?`,
            )
            .get(walletId, address, networkSymbol, sequence) as
            | Omit<SignedConflictResolution, 'address'>
            | undefined;

        return row ? { address, ...row } : null;
    }

    putConflictResolution(
        walletId: string,
        address: string,
        networkSymbol: string,
        sequence: number,
        record: SignedConflictResolution,
    ): void {
        this.db
            .prepare(
                `INSERT INTO auth_conflict_resolution
                    (wallet_id, address, network_symbol, sequence, resolved_old_value,
                     resolved_old_counter, resolved_new_value, resolved_new_counter, mac)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                 ON CONFLICT(wallet_id, address, network_symbol, sequence) DO UPDATE SET
                     resolved_old_value   = excluded.resolved_old_value,
                     resolved_old_counter = excluded.resolved_old_counter,
                     resolved_new_value   = excluded.resolved_new_value,
                     resolved_new_counter = excluded.resolved_new_counter,
                     mac                  = excluded.mac`,
            )
            .run(
                walletId,
                address,
                networkSymbol,
                sequence,
                record.resolved_old_value,
                record.resolved_old_counter,
                record.resolved_new_value,
                record.resolved_new_counter,
                record.mac,
            );
    }

    clearAll(): void {
        this.db.prepare('DELETE FROM addresses').run();
        this.db.prepare('DELETE FROM tree_state').run();
        this.db.prepare('DELETE FROM auth_queue').run();
        this.db.prepare('DELETE FROM auth_history').run();
        this.db.prepare('DELETE FROM auth_conflict_resolution').run();
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
