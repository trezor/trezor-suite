/**
 * What wardd persists: an APPEND-ONLY log of transitions, each carrying the leaves it changed.
 *
 * WHY NOT A TABLE OF LEAVES. A replica that several hosts write through a CRDT cannot hold "the
 * current leaves" as mutable rows: two hosts that both apply a write at counter N write the same
 * rows, the WM compare-and-swaps exactly one of them in, and the loser's rows have already
 * replicated. Last-writer-wins would then mix the two branches -- a tree no device ever built.
 *
 * So a row is written ONCE and never updated, and its id is the transition itself: nothing can
 * conflict. The tree at a head is DERIVED by walking the links back from that head to genesis and
 * replaying their changes forward (`materialize`). A losing branch is a set of rows no head walks
 * through -- harmless, and exactly what `WardRejoin` needs, since the device walks its own branch
 * back to the fork too.
 *
 * ONE ROW PER TRANSITION, so a batch of up to MAX_BATCH leaves lands in one write: the host
 * obligation `WardFlushQueue.max_batch` states (store it whole, or not at all) holds by
 * construction.
 */
import { sha256 } from '@noble/hashes/sha2.js';

import { type WardLeaf, toBytes, toHex } from '@trezor/ward-core';

export interface StoredChange {
    /** hex */
    entryKey: string;
    /** null is a deletion */
    leaf: WardLeaf | null;
}

export interface StoredLink {
    fromCounter: number;
    /** hex; null is the empty tree */
    fromRoot: string | null;
    toCounter: number;
    toRoot: string | null;
    authCommit: string;
    operation: 'commit' | 'revert';
    /** the device's WM authorisation for this step, kept so it can be (re)published */
    wmSig: string | null;
    changes: StoredChange[];
}

/** A link's identity: the transition and its authorisation. Two hosts storing one link agree. */
export const linkId = (link: StoredLink): string =>
    toHex(
        sha256(
            new TextEncoder().encode(
                [
                    link.fromCounter,
                    link.fromRoot ?? '',
                    link.toCounter,
                    link.toRoot ?? '',
                    link.authCommit,
                ].join('/'),
            ),
        ),
    ).slice(0, 32);

export interface WardBackend {
    /** Every link this replica holds, in the order they were appended where known. */
    load(): Promise<StoredLink[]>;
    /** Persist one link, atomically; resolves once it is durable locally. */
    append(link: StoredLink): Promise<void>;
    close(): Promise<void>;
}

export class InMemoryWardBackend implements WardBackend {
    private links = new Map<string, StoredLink>();

    load() {
        return Promise.resolve([...this.links.values()]);
    }

    append(link: StoredLink) {
        // round-trip through JSON so a caller mutating its object cannot reach into the store
        this.links.set(linkId(link), JSON.parse(JSON.stringify(link)));

        return Promise.resolve();
    }

    close() {
        return Promise.resolve();
    }
}

export const hexOrNull = (v: Uint8Array | null | undefined): string | null =>
    v && v.length ? toHex(v) : null;

export const bytesOrNull = (v: string | null | undefined): Uint8Array | null =>
    v ? toBytes(v) : null;
