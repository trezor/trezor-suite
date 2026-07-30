/**
 * @trezor/ward/storage — the storage-provider CONTRACT + a pure in-memory reference impl.
 *
 * Zero native dependencies (the better-sqlite3-backed adapter lives in the separate
 * ./sqlite subpath). The only production implementation today is the sqlite WardDb;
 * an Evolu-backed implementation for suite-desktop is planned.
 */
import type { TreeState, WardEntry, WardRow } from '../types';

/**
 * WardProvider — the host-storage seam (data plane).
 *
 * OWNS: durable per-`wardId` storage of WARD entries and the tree checkpoint
 * (TreeState). Every entry lives under a `wardId` — the WM-facing, SLIP21-derived
 * per-wallet anchor — so two wallets' addresses never mix into one root. The
 * provider is deliberately unaware of the device-local `walletId`; `wardId` is the
 * only identity it sees.
 * MUST NOT: build/verify proofs, talk to the device, or derive counters — it is
 * dumb storage. The app layer (`../app`) orchestrates; the device authenticates.
 * SEAMS: `InMemoryWardDb` (below, dev/test) and the better-sqlite3 `WardDb`
 * (`./sqlite`). An Evolu-backed implementation for suite-desktop is planned — write
 * it against THIS contract.
 */
export type WardProvider = {
    lookup(
        wardId: string,
        appId: string,
        address: string,
        networkSymbol: string,
    ): WardEntry | null | Promise<WardEntry | null>;
    upsert(
        wardId: string,
        appId: string,
        address: string,
        networkSymbol: string,
        entry: WardEntry,
    ): void | Promise<void>;
    getAllEntries(wardId: string): WardRow[] | Promise<WardRow[]>;
    /** Each wallet keeps its own root checkpoint, identified by wardId. */
    getTreeState(wardId: string): TreeState | null | Promise<TreeState | null>;
    setTreeState(wardId: string, state: TreeState): void | Promise<void>;
    /** Releases any held resources (e.g. an open database handle). */
    dispose?(): void | Promise<void>;
};

// ---------------------------------------------------------------------------
// Pure in-memory reference implementation (no native deps). Handy for unit tests
// and for consumers that only need an ephemeral provider. Not used in production.
// ---------------------------------------------------------------------------

const key = (wardId: string, appId: string, address: string, networkSymbol: string) =>
    `${wardId} ${appId} ${address} ${networkSymbol}`;

export class InMemoryWardDb implements WardProvider {
    private entries = new Map<string, WardRow>();
    private order: string[] = [];
    private treeState = new Map<string, TreeState>();

    lookup(
        wardId: string,
        appId: string,
        address: string,
        networkSymbol: string,
    ): WardEntry | null {
        return this.entries.get(key(wardId, appId, address, networkSymbol))?.entry ?? null;
    }

    upsert(
        wardId: string,
        appId: string,
        address: string,
        networkSymbol: string,
        entry: WardEntry,
    ): void {
        const k = key(wardId, appId, address, networkSymbol);
        if (!this.entries.has(k)) this.order.push(k);
        this.entries.set(k, { appId, address, networkSymbol, entry });
    }

    getAllEntries(wardId: string): WardRow[] {
        const prefix = `${wardId} `;

        return this.order
            .filter(k => k.startsWith(prefix))
            .map(k => this.entries.get(k))
            .filter((r): r is WardRow => r !== undefined);
    }

    getTreeState(wardId: string): TreeState | null {
        return this.treeState.get(wardId) ?? null;
    }

    setTreeState(wardId: string, state: TreeState): void {
        this.treeState.set(wardId, state);
    }
}
