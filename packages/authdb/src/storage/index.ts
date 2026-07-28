/**
 * @trezor/ward/storage — the storage-provider CONTRACT + a pure in-memory reference impl.
 *
 * Zero native dependencies (the better-sqlite3-backed adapter lives in the separate
 * ./sqlite subpath). The only production implementation today is the sqlite AuthLabelDb;
 * an Evolu-backed implementation for suite-desktop is planned.
 */
import type { AuthLabelEntry, AuthLabelRow, TreeState } from '../types';

/**
 * Required storage contract for auth-label entries. Every entry lives under a
 * wardId — the WM-facing, SLIP21-derived per-wallet anchor. The Merkle tree (and
 * its root/counter checkpoint in TreeState) is computed per wardId, so two
 * wallets' addresses never mix into one root. The provider is deliberately unaware
 * of the device-local walletId; wardId is the only identity it sees.
 */
export type AuthLabelLookupProvider = {
    lookup(
        wardId: string,
        address: string,
        networkSymbol: string,
    ): AuthLabelEntry | null | Promise<AuthLabelEntry | null>;
    upsert(
        wardId: string,
        address: string,
        networkSymbol: string,
        entry: AuthLabelEntry,
    ): void | Promise<void>;
    getAllEntries(wardId: string): AuthLabelRow[] | Promise<AuthLabelRow[]>;
    /** Each wallet keeps its own root checkpoint, identified by wardId. */
    getTreeState(wardId: string): TreeState | null | Promise<TreeState | null>;
    setTreeState(wardId: string, state: TreeState): void | Promise<void>;
    /** Releases any held resources (e.g. an open database handle). */
    dispose?(): void | Promise<void>;
};

/** Provider type accepted by ConnectSettings. */
export type AuthLabelProvider = AuthLabelLookupProvider;

// ---------------------------------------------------------------------------
// Pure in-memory reference implementation (no native deps). Handy for unit tests
// and for consumers that only need an ephemeral provider. Not used in production.
// ---------------------------------------------------------------------------

const key = (wardId: string, address: string, networkSymbol: string) =>
    `${wardId} ${address} ${networkSymbol}`;

export class InMemoryAuthLabelDb implements AuthLabelLookupProvider {
    private entries = new Map<string, AuthLabelRow>();
    private order: string[] = [];
    private treeState = new Map<string, TreeState>();

    lookup(wardId: string, address: string, networkSymbol: string): AuthLabelEntry | null {
        return this.entries.get(key(wardId, address, networkSymbol))?.entry ?? null;
    }

    upsert(wardId: string, address: string, networkSymbol: string, entry: AuthLabelEntry): void {
        const k = key(wardId, address, networkSymbol);
        if (!this.entries.has(k)) this.order.push(k);
        this.entries.set(k, { address, networkSymbol, entry });
    }

    getAllEntries(wardId: string): AuthLabelRow[] {
        const prefix = `${wardId} `;

        return this.order
            .filter(k => k.startsWith(prefix))
            .map(k => this.entries.get(k))
            .filter((r): r is AuthLabelRow => r !== undefined);
    }

    getTreeState(wardId: string): TreeState | null {
        return this.treeState.get(wardId) ?? null;
    }

    setTreeState(wardId: string, state: TreeState): void {
        this.treeState.set(wardId, state);
    }
}
