import type { WorkerState } from '../../state';

export type HistoryEntry = {
    txid: string;
    blockNumber: number;
    transactionIndex: number;
    blockTimestamp?: number;
};

export type DescriptorHistory = {
    /** Oldest block scanned, inclusive. Meaningless while `syncedTo` is COLD. */
    syncedFrom: number;
    /** Newest block scanned, inclusive, or COLD when nothing has been scanned yet. */
    syncedTo: number;
    entries: Map<string, HistoryEntry>;
    /** Lowercased contract addresses seen transferring to or from this descriptor. */
    tokenContracts: Set<string>;
};

export const COLD = -1;

export const isCold = (history: DescriptorHistory) => history.syncedTo === COLD;

type WorkerHistory = {
    descriptors: Map<string, DescriptorHistory>;
    /**
     * Transactions this worker broadcast, insertion-ordered. A transfer-log scan cannot see a
     * transaction that moved nothing (an approval, a failed call), so the account's own sends are
     * remembered here and resolved by receipt instead. Held per worker rather than per descriptor
     * because pushTransaction only receives the signed payload, not whose account it came from.
     */
    ownTxids: Set<string>;
};

// Keyed by the worker's state, so two chains served by the same module never share history and the
// whole thing is collected with the worker. Deliberately not `state.cache`, whose mandatory TTL
// would either expire mid-session or be a lie.
const workerHistories = new WeakMap<WorkerState, WorkerHistory>();

const MAX_OWN_TXIDS = 32;

const getWorkerHistory = (state: WorkerState): WorkerHistory => {
    const existing = workerHistories.get(state);
    if (existing) return existing;

    const created: WorkerHistory = { descriptors: new Map(), ownTxids: new Set() };
    workerHistories.set(state, created);

    return created;
};

export const getDescriptorHistory = (state: WorkerState, descriptor: string): DescriptorHistory => {
    const { descriptors } = getWorkerHistory(state);
    const key = descriptor.toLowerCase();
    const existing = descriptors.get(key);
    if (existing) return existing;

    const created: DescriptorHistory = {
        syncedFrom: COLD,
        syncedTo: COLD,
        entries: new Map(),
        tokenContracts: new Set(),
    };
    descriptors.set(key, created);

    return created;
};

export const recordOwnTxid = (state: WorkerState, txid: string) => {
    const { ownTxids } = getWorkerHistory(state);
    ownTxids.add(txid.toLowerCase());

    while (ownTxids.size > MAX_OWN_TXIDS) {
        const oldest = ownTxids.values().next();
        if (oldest.done) break;
        ownTxids.delete(oldest.value);
    }
};

export const getOwnTxids = (state: WorkerState) => [...getWorkerHistory(state).ownTxids];

export const forgetOwnTxid = (state: WorkerState, txid: string) => {
    getWorkerHistory(state).ownTxids.delete(txid.toLowerCase());
};

/** Newest first. Ties inside a block are broken by position, so paging stays stable. */
export const sortedEntries = (history: DescriptorHistory): HistoryEntry[] =>
    [...history.entries.values()].sort(
        (a, b) => b.blockNumber - a.blockNumber || b.transactionIndex - a.transactionIndex,
    );
