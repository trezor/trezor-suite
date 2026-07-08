/* eslint-disable no-console -- verbose AuthDB diagnostics (dev/testing sqlite backend) */
/**
 * @trezor/authdb/storage/sqlite — better-sqlite3-backed reference implementation of the
 * AuthLabelLookupProvider contract. Isolated behind its own subpath so the native
 * better-sqlite3 module (an optionalDependency) never reaches barrel/proof consumers.
 * Used by connect-cli for dev/testing; suite-desktop will supply an Evolu-backed impl.
 */
import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname } from 'path';

import type { AuthLabelLookupProvider } from '../';
import type { AuthLabelEntry, AuthLabelMetadata, AuthLabelRow, TreeState } from '../../types';

type SqliteAddressRow = {
    wallet_id: string;
    address: string;
    network_symbol: string;
    data: string;
    counter: number;
};
type TreeStateRow = { root: string; counter: number; mac: string | null };

const parseRow = (row: SqliteAddressRow): AuthLabelEntry => ({
    metadata: JSON.parse(row.data) as AuthLabelMetadata,
    counter: row.counter ?? 0,
});

export class AuthLabelDb implements AuthLabelLookupProvider {
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
                PRIMARY KEY (wallet_id, address, network_symbol)
            );
            CREATE TABLE IF NOT EXISTS tree_state (
                wallet_id TEXT PRIMARY KEY,
                root      TEXT NOT NULL,
                counter   INTEGER NOT NULL DEFAULT 0,
                mac       TEXT
            );
        `);
    }

    lookup(walletId: string, address: string, networkSymbol: string): AuthLabelEntry | null {
        const row = this.db
            .prepare(
                `SELECT data, counter FROM addresses
                 WHERE wallet_id = ? AND address = ? AND network_symbol = ?`,
            )
            .get(walletId, address, networkSymbol) as
            | Pick<SqliteAddressRow, 'data' | 'counter'>
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
