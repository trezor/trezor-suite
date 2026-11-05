/**
 * @trezor/ward/storage — the storage-provider CONTRACT + a pure in-memory reference impl.
 *
 * Zero native dependencies (the better-sqlite3-backed adapter lives in the separate
 * ./sqlite subpath). The only production implementation today is the sqlite WardDb;
 * an Evolu-backed implementation for suite-desktop is planned.
 */
import type { TreeState, WardEntry, WardRow, WardTransition } from '../types';

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
    /** FULL delete: the record ceases to exist. A WARD delete removes the leaf from
     * the trie outright (the device returns both leaf parts empty), so the host must
     * drop the row rather than keep an empty-valued one — otherwise `lookup` keeps
     * answering with stale metadata for an entry that is provably absent on-device.
     * Optional so existing/mock providers stay valid. */
    remove?(
        wardId: string,
        appId: string,
        address: string,
        networkSymbol: string,
    ): void | Promise<void>;
    getAllEntries(wardId: string): WardRow[] | Promise<WardRow[]>;
    /** Serve a proof by the opaque trie path: the row whose entry_key matches, or
     * null. The keyed-path read primitive (the host never needs the identifier).
     * Optional so existing/mock providers stay valid; concrete providers implement it
     * and Gap 10 serve-by-key can require it via a guard. */
    /** FIXME(ward, UNWIRED): implemented by both providers and never called --
     * proofAck.ts:buildAckByKey does a linear `rows.find` over blobRows() instead.
     * Wiring this turns membership serving from O(n) into an indexed O(1) hit. */
    getByEntryKey?(wardId: string, entryKey: string): WardRow | null | Promise<WardRow | null>;
    /** Each wallet keeps its own root checkpoint, identified by wardId. */
    getTreeState(wardId: string): TreeState | null | Promise<TreeState | null>;
    setTreeState(wardId: string, state: TreeState): void | Promise<void>;
    /** Append the authenticated transition for a committed write (§7 lineage), and
     * read them back (ascending `counter`) for backward-walk reconstruction. Optional so
     * existing/mock providers stay valid; the sqlite/in-memory ones implement them. */
    appendTransition?(wardId: string, transition: WardTransition): void | Promise<void>;
    getTransitions?(wardId: string): WardTransition[] | Promise<WardTransition[]>;
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
    private transitions = new Map<string, WardTransition[]>();

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
        this.entries.set(k, {
            appId,
            address,
            networkSymbol,
            entryKey: entry.blob?.entryKey,
            entry,
        });
    }

    remove(wardId: string, appId: string, address: string, networkSymbol: string): void {
        const k = key(wardId, appId, address, networkSymbol);
        this.entries.delete(k);
        this.order = this.order.filter(o => o !== k);
    }

    getAllEntries(wardId: string): WardRow[] {
        const prefix = `${wardId} `;

        return this.order
            .filter(k => k.startsWith(prefix))
            .map(k => this.entries.get(k))
            .filter((r): r is WardRow => r !== undefined);
    }

    getByEntryKey(wardId: string, entryKey: string): WardRow | null {
        const prefix = `${wardId} `;

        return (
            this.order
                .filter(k => k.startsWith(prefix))
                .map(k => this.entries.get(k))
                .find((r): r is WardRow => r?.entryKey === entryKey) ?? null
        );
    }

    getTreeState(wardId: string): TreeState | null {
        return this.treeState.get(wardId) ?? null;
    }

    setTreeState(wardId: string, state: TreeState): void {
        this.treeState.set(wardId, state);
    }

    appendTransition(wardId: string, transition: WardTransition): void {
        const list = this.transitions.get(wardId) ?? [];
        list.push(transition);
        this.transitions.set(wardId, list);
    }

    getTransitions(wardId: string): WardTransition[] {
        return [...(this.transitions.get(wardId) ?? [])].sort((a, b) => a.counter - b.counter);
    }
}
