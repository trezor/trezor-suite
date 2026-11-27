/**
 * What wardd persists: an APPEND-ONLY log of transitions, each carrying the leaves it changed.
 *
 * WHY NOT A TABLE OF LEAVES. A replica that several hosts write through a CRDT cannot hold "the
 * current leaves" as mutable rows: two hosts that both apply a write at counter N write the same
 * rows, the WM lets exactly one of them in by the predecessor check, and the loser's rows have
 * already replicated. Last-writer-wins would then mix the two branches -- a tree no device ever
 * built.
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
    /** A revert rebuilds the prior tree at (recoveredCounter, toRoot). */
    recoveredCounter?: number;
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

/**
 * A WM attestation this host relayed, kept with the round nonce it was signed over: proof that the
 * WM held `to` at `timestamp`. While the WM is down, `catchUp` names the newest head on the
 * replica's chain that one of these vouches for, and the device verifies the signature itself.
 * Hosts keep one verified proof per step and replicate it with the links, so a host that never
 * talked to the WM can catch a device up too. WardRollback asks for them by the same step.
 */
export interface StoredAttestation {
    fromCounter: number;
    /** hex; null is the empty tree */
    fromRoot: string | null;
    toCounter: number;
    /** hex; null is the empty tree */
    toRoot: string | null;
    /** the WM's clock, seconds: when it reached `to` */
    timestamp: number;
    /** the round nonce the signature covers */
    nonce: string;
    signature: string;
}

/**
 * One id per step `(from, to)`, shared by every attestation of it: the WM's counter only rises, so
 * within one register history a step is accepted once. The newest attestation of a step wins.
 */
export const attestationStepKey = (a: {
    fromCounter: number;
    fromRoot: string | null;
    toCounter: number;
    toRoot: string | null;
}): string => `${a.fromCounter}:${a.fromRoot ?? ''}:${a.toCounter}:${a.toRoot ?? ''}`;

export const attestationId = (a: StoredAttestation): string =>
    toHex(sha256(new TextEncoder().encode(attestationStepKey(a)))).slice(0, 32);

export interface WardBackend {
    /** Every link this replica holds, in the order they were appended where known. */
    load(): Promise<StoredLink[]>;
    /** Persist one link, atomically; resolves once it is durable locally. */
    append(link: StoredLink): Promise<void>;
    /** Every WM attestation this replica holds. */
    loadAttestations(): Promise<StoredAttestation[]>;
    /** Persist a verified attestation under its step. */
    appendAttestation(attestation: StoredAttestation): Promise<void>;
    close(): Promise<void>;
}

const short = (hex: string | null) => (hex ? `${hex.slice(0, 12)}…` : 'empty');

/**
 * A backend that says what it stores: one line per transition written, with its step and every
 * change -- the entry key, and for a put the sizes of the sealed parts (never their bytes). The
 * replica holds only sealed parts, so this is everything it could reveal anyway.
 */
export const loggingBackend = (inner: WardBackend, log: (line: string) => void): WardBackend => {
    // the replica is read on every operation; say so only when what it holds has changed
    let held: number | null = null;

    return {
        async load() {
            const links = await inner.load();
            if (links.length !== held) log(`replica: holds ${links.length} transition(s)`);
            held = links.length;

            return links;
        },
        async append(link) {
            const step = `${link.fromCounter} -> ${link.toCounter}`;
            log(
                `replica: storing ${link.operation} ${step} root=${short(link.toRoot)}` +
                    ` changes=${link.changes.length}${link.wmSig ? ' +wm_sig' : ''}`,
            );
            for (const change of link.changes) {
                const sizes = change.leaf
                    ? `put content=${toBytes(change.leaf.content ?? '').length}B` +
                      ` identity=${toBytes(change.leaf.identity ?? '').length}B`
                    : 'delete';
                log(`replica:   entry=${short(change.entryKey)} ${sizes}`);
            }
            await inner.append(link);
            log(`replica: stored ${step} (durable locally)`);
        },
        loadAttestations: () => inner.loadAttestations(),
        async appendAttestation(attestation) {
            log(
                `replica: keeping the WM's attestation of #${attestation.toCounter}` +
                    ` root=${short(attestation.toRoot)} at ${attestation.timestamp}`,
            );
            await inner.appendAttestation(attestation);
        },
        close: () => inner.close(),
    };
};

export class InMemoryWardBackend implements WardBackend {
    private links = new Map<string, StoredLink>();
    private attestations = new Map<string, StoredAttestation>();

    load() {
        return Promise.resolve([...this.links.values()]);
    }

    append(link: StoredLink) {
        // round-trip through JSON so a caller mutating its object cannot reach into the store
        this.links.set(linkId(link), JSON.parse(JSON.stringify(link)));

        return Promise.resolve();
    }

    loadAttestations() {
        return Promise.resolve([...this.attestations.values()]);
    }

    appendAttestation(attestation: StoredAttestation) {
        this.attestations.set(attestationId(attestation), { ...attestation });

        return Promise.resolve();
    }

    close() {
        return Promise.resolve();
    }
}

export const hexOrNull = (v: Uint8Array | null | undefined): string | null =>
    v?.length ? toHex(v) : null;

export const bytesOrNull = (v: string | null | undefined): Uint8Array | null =>
    v ? toBytes(v) : null;
