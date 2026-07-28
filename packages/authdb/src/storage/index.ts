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
 * walletId — the Merkle tree (and its root/counter checkpoint in TreeState) is
 * computed per wallet, so two wallets' addresses never mix into one root.
 */
export type AuthLabelLookupProvider = {
    lookup(
        walletId: string,
        address: string,
        networkSymbol: string,
    ): AuthLabelEntry | null | Promise<AuthLabelEntry | null>;
    upsert(
        walletId: string,
        address: string,
        networkSymbol: string,
        entry: AuthLabelEntry,
    ): void | Promise<void>;
    getAllEntries(walletId: string): AuthLabelRow[] | Promise<AuthLabelRow[]>;
    /** Each wallet keeps its own root checkpoint, identified by walletId. */
    getTreeState(walletId: string): TreeState | null | Promise<TreeState | null>;
    setTreeState(walletId: string, state: TreeState): void | Promise<void>;
    /** Releases any held resources (e.g. an open database handle). */
    dispose?(): void | Promise<void>;
};

/** Provider type accepted by ConnectSettings. */
export type AuthLabelProvider = AuthLabelLookupProvider;

// ---------------------------------------------------------------------------
// Pure in-memory reference implementation (no native deps). Handy for unit tests
// and for consumers that only need an ephemeral provider. Not used in production.
// ---------------------------------------------------------------------------

const key = (walletId: string, address: string, networkSymbol: string) =>
    `${walletId} ${address} ${networkSymbol}`;

export class InMemoryAuthLabelDb implements AuthLabelLookupProvider {
    private entries = new Map<string, AuthLabelRow>();
    private order: string[] = [];
    private treeState = new Map<string, TreeState>();

    lookup(walletId: string, address: string, networkSymbol: string): AuthLabelEntry | null {
        return this.entries.get(key(walletId, address, networkSymbol))?.entry ?? null;
    }

    upsert(walletId: string, address: string, networkSymbol: string, entry: AuthLabelEntry): void {
        const k = key(walletId, address, networkSymbol);
        if (!this.entries.has(k)) this.order.push(k);
        this.entries.set(k, { address, networkSymbol, entry });
    }

    getAllEntries(walletId: string): AuthLabelRow[] {
        const prefix = `${walletId} `;

        return this.order
            .filter(k => k.startsWith(prefix))
            .map(k => this.entries.get(k))
            .filter((r): r is AuthLabelRow => r !== undefined);
    }

    getTreeState(walletId: string): TreeState | null {
        return this.treeState.get(walletId) ?? null;
    }

    setTreeState(walletId: string, state: TreeState): void {
        this.treeState.set(walletId, state);
    }
}
