/* eslint-disable no-console -- verbose AuthDB diagnostics (dev/testing sqlite backend) */
/**
 * @trezor/ward/storage/sqlite — better-sqlite3-backed reference implementation of the
 * WardProvider contract. Isolated behind its own subpath so the native
 * better-sqlite3 module (an optionalDependency) never reaches barrel/proof consumers.
 * Used by connect-cli for dev/testing; suite-desktop will supply an Evolu-backed impl.
 */
import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname } from 'path';

import type { WardProvider } from '../';
import type {
    TreeState,
    WardEntry,
    WardLabel,
    WardLeafBlob,
    WardRow,
    WardTransition,
} from '../../types';

type SqliteAddressRow = {
    ward_id: string;
    app_id: string;
    address: string;
    network_symbol: string;
    data: string;
    counter: number;
    blob: string | null;
    entry_key: string | null;
};

type TreeStateRow = { root: string; counter: number; mac: string | null };

const parseRow = (row: Pick<SqliteAddressRow, 'data' | 'counter' | 'blob'>): WardEntry => ({
    metadata: JSON.parse(row.data) as WardLabel,
    counter: row.counter ?? 0,
    ...(row.blob != null && { blob: JSON.parse(row.blob) as WardLeafBlob }),
});

const toRow = (r: SqliteAddressRow): WardRow => {
    const entry = parseRow(r);

    return {
        appId: r.app_id,
        address: r.address,
        networkSymbol: r.network_symbol,
        ...(r.entry_key != null && { entryKey: r.entry_key }),
        entry,
    };
};

export class WardDb implements WardProvider {
    private db: Database.Database;

    constructor(dbPath: string) {
        mkdirSync(dirname(dbPath), { recursive: true });
        this.db = new Database(dbPath);
        console.log('[WardDb] opened SQLite database:', dbPath);
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS addresses (
                ward_id      TEXT NOT NULL,
                app_id         TEXT NOT NULL,
                address        TEXT NOT NULL,
                network_symbol TEXT NOT NULL,
                counter        INTEGER NOT NULL DEFAULT 0,
                data           TEXT NOT NULL,
                blob           TEXT,
                entry_key      TEXT,
                PRIMARY KEY (ward_id, app_id, address, network_symbol)
            );
            CREATE INDEX IF NOT EXISTS addresses_entry_key ON addresses (ward_id, entry_key);
            CREATE TABLE IF NOT EXISTS tree_state (
                ward_id TEXT PRIMARY KEY,
                root      TEXT NOT NULL,
                counter   INTEGER NOT NULL DEFAULT 0,
                mac       TEXT
            );
            CREATE TABLE IF NOT EXISTS transitions (
                ward_id         TEXT NOT NULL,
                counter         INTEGER NOT NULL,
                prev_root       TEXT NOT NULL,
                target_root     TEXT NOT NULL,
                target_root_mac TEXT,
                leaves          TEXT NOT NULL,   -- JSON array of WardLeafBlob (batch, 1..N)
                auth_commit     TEXT,
                head_mac        TEXT,
                sig_commit      TEXT,
                PRIMARY KEY (ward_id, counter)
            );
        `);
        // Migrate a pre-keyed-model DB: add the device leaf-blob + entry_key columns if missing.
        for (const col of ['blob TEXT', 'entry_key TEXT']) {
            try {
                this.db.exec(`ALTER TABLE addresses ADD COLUMN ${col}`);
            } catch {
                // already present — ignore
            }
        }
    }

    lookup(
        wardId: string,
        appId: string,
        address: string,
        networkSymbol: string,
    ): WardEntry | null {
        const row = this.db
            .prepare(
                `SELECT data, counter, blob FROM addresses
                 WHERE ward_id = ? AND app_id = ? AND address = ? AND network_symbol = ?`,
            )
            .get(wardId, appId, address, networkSymbol) as
            | Pick<SqliteAddressRow, 'data' | 'counter' | 'blob'>
            | undefined;

        return row ? parseRow(row) : null;
    }

    upsert(
        wardId: string,
        appId: string,
        address: string,
        networkSymbol: string,
        entry: WardEntry,
    ): void {
        this.db
            .prepare(
                `INSERT INTO addresses (ward_id, app_id, address, network_symbol, counter, data, blob, entry_key)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                 ON CONFLICT(ward_id, app_id, address, network_symbol) DO UPDATE SET
                     counter   = excluded.counter,
                     data      = excluded.data,
                     blob      = excluded.blob,
                     entry_key = excluded.entry_key`,
            )
            .run(
                wardId,
                appId,
                address,
                networkSymbol,
                entry.counter,
                JSON.stringify(entry.metadata),
                entry.blob !== undefined ? JSON.stringify(entry.blob) : null,
                entry.blob?.entryKey ?? null,
            );
    }

    getAllEntries(wardId: string): WardRow[] {
        const rows = this.db
            .prepare(
                `SELECT ward_id, app_id, address, network_symbol, counter, data, blob, entry_key
                 FROM addresses WHERE ward_id = ? ORDER BY rowid`,
            )
            .all(wardId) as SqliteAddressRow[];

        return rows.map(toRow);
    }

    getByEntryKey(wardId: string, entryKey: string): WardRow | null {
        const row = this.db
            .prepare(
                `SELECT ward_id, app_id, address, network_symbol, counter, data, blob, entry_key
                 FROM addresses WHERE ward_id = ? AND entry_key = ?`,
            )
            .get(wardId, entryKey) as SqliteAddressRow | undefined;

        return row ? toRow(row) : null;
    }

    getTreeState(wardId: string): TreeState | null {
        const row = this.db
            .prepare('SELECT root, counter, mac FROM tree_state WHERE ward_id = ?')
            .get(wardId) as TreeStateRow | undefined;

        return row ? { root: row.root, counter: row.counter, mac: row.mac ?? undefined } : null;
    }

    setTreeState(wardId: string, state: TreeState): void {
        this.db
            .prepare(
                `INSERT INTO tree_state (ward_id, root, counter, mac) VALUES (?, ?, ?, ?)
                 ON CONFLICT(ward_id) DO UPDATE SET
                     root    = excluded.root,
                     counter = excluded.counter,
                     mac     = excluded.mac`,
            )
            .run(wardId, state.root, state.counter, state.mac ?? null);
    }

    appendTransition(wardId: string, t: WardTransition): void {
        this.db
            .prepare(
                `INSERT INTO transitions
                     (ward_id, counter, prev_root, target_root, target_root_mac,
                      leaves, auth_commit, head_mac, sig_commit)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                 ON CONFLICT(ward_id, counter) DO UPDATE SET
                     prev_root       = excluded.prev_root,
                     target_root     = excluded.target_root,
                     target_root_mac = excluded.target_root_mac,
                     leaves          = excluded.leaves,
                     auth_commit     = excluded.auth_commit,
                     head_mac        = excluded.head_mac,
                     sig_commit      = excluded.sig_commit`,
            )
            .run(
                wardId,
                t.counter,
                t.prevRoot,
                t.targetRoot,
                t.targetRootMac ?? null,
                JSON.stringify(t.leaves),
                t.authCommit ?? null,
                t.headMac ?? null,
                t.sigCommit ?? null,
            );
    }

    getTransitions(wardId: string): WardTransition[] {
        const rows = this.db
            .prepare(
                `SELECT counter, prev_root, target_root, target_root_mac,
                        leaves, auth_commit, head_mac, sig_commit
                 FROM transitions WHERE ward_id = ? ORDER BY counter`,
            )
            .all(wardId) as {
            counter: number;
            prev_root: string;
            target_root: string;
            target_root_mac: string | null;
            leaves: string;
            auth_commit: string | null;
            head_mac: string | null;
            sig_commit: string | null;
        }[];

        return rows.map(r => ({
            counter: r.counter,
            prevRoot: r.prev_root,
            targetRoot: r.target_root,
            ...(r.target_root_mac != null && { targetRootMac: r.target_root_mac }),
            leaves: JSON.parse(r.leaves) as WardLeafBlob[],
            ...(r.auth_commit != null && { authCommit: r.auth_commit }),
            ...(r.head_mac != null && { headMac: r.head_mac }),
            ...(r.sig_commit != null && { sigCommit: r.sig_commit }),
        }));
    }

    clearAll(): void {
        this.db.prepare('DELETE FROM addresses').run();
        this.db.prepare('DELETE FROM tree_state').run();
        this.db.prepare('DELETE FROM transitions').run();
    }

    private closed = false;

    // Idempotent: safe to call from both connect-cli's own bookkeeping and connect's
    // dispose lifecycle without risking a double-close on the sqlite handle.
    close(): void {
        if (this.closed) return;
        this.closed = true;
        this.db.close();
    }

    dispose(): void {
        this.close();
    }
}
