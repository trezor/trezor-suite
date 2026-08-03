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
import type { TreeState, WardEntry, WardLabel, WardLeafBlob, WardRow } from '../../types';

type SqliteAddressRow = {
    ward_id: string;
    app_id: string;
    address: string;
    network_symbol: string;
    data: string;
    counter: number;
    blob: string | null;
};
type TreeStateRow = { root: string; counter: number; mac: string | null };

const parseRow = (row: SqliteAddressRow): WardEntry => ({
    metadata: JSON.parse(row.data) as WardLabel,
    counter: row.counter ?? 0,
    ...(row.blob != null && { blob: JSON.parse(row.blob) as WardLeafBlob }),
});

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
                PRIMARY KEY (ward_id, app_id, address, network_symbol)
            );
            CREATE TABLE IF NOT EXISTS tree_state (
                ward_id TEXT PRIMARY KEY,
                root      TEXT NOT NULL,
                counter   INTEGER NOT NULL DEFAULT 0,
                mac       TEXT
            );
        `);
        // Migrate a pre-keyed-model DB: add the device leaf-blob column if missing.
        try {
            this.db.exec('ALTER TABLE addresses ADD COLUMN blob TEXT');
        } catch {
            // already present — ignore
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

        return row
            ? parseRow({
                  ward_id: wardId,
                  app_id: appId,
                  address,
                  network_symbol: networkSymbol,
                  ...row,
              })
            : null;
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
                `INSERT INTO addresses (ward_id, app_id, address, network_symbol, counter, data, blob)
                 VALUES (?, ?, ?, ?, ?, ?, ?)
                 ON CONFLICT(ward_id, app_id, address, network_symbol) DO UPDATE SET
                     counter = excluded.counter,
                     data    = excluded.data,
                     blob    = excluded.blob`,
            )
            .run(
                wardId,
                appId,
                address,
                networkSymbol,
                entry.counter,
                JSON.stringify(entry.metadata),
                entry.blob !== undefined ? JSON.stringify(entry.blob) : null,
            );
    }

    getAllEntries(wardId: string): WardRow[] {
        const rows = this.db
            .prepare(
                `SELECT ward_id, app_id, address, network_symbol, counter, data, blob FROM addresses
                 WHERE ward_id = ? ORDER BY rowid`,
            )
            .all(wardId) as SqliteAddressRow[];

        return rows.map(r => ({
            appId: r.app_id,
            address: r.address,
            networkSymbol: r.network_symbol,
            entry: parseRow(r),
        }));
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

    clearAll(): void {
        this.db.prepare('DELETE FROM addresses').run();
        this.db.prepare('DELETE FROM tree_state').run();
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
