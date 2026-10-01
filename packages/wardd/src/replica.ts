/**
 * The tree at a head, derived from the link log -- see `backend.ts` for why it is derived.
 */
import { EMPTY_ROOT, type Link, WardTrie, equalBytes, toBytes, toHex } from '@trezor/ward-core';

import { type StoredLink, bytesOrNull } from './backend';

export interface Head {
    counter: number;
    root: Uint8Array | null;
}

export interface Replica {
    /** leaves at `head`, and EVERY link held -- dead branches included, for chain walks */
    trie: WardTrie;
    head: Head;
    /** the head asked for is not one this replica can build: rows are missing */
    behind: boolean;
}

const sameRoot = (a: Uint8Array | null, b: Uint8Array | null) =>
    equalBytes(a ?? EMPTY_ROOT, b ?? EMPTY_ROOT);

/** Genesis-to-head, oldest first; null if the walk back does not reach the empty tree at 0. */
const chainTo = (trie: WardTrie, head: Head): Link[] | null => {
    if (head.counter === 0) return sameRoot(head.root, null) ? [] : null;
    const back = trie.linksEndingAt(head.counter, head.root, Number.MAX_SAFE_INTEGER);
    const oldest = back[back.length - 1];
    if (!oldest || oldest.fromCounter !== 0 || !sameRoot(oldest.fromRoot, null)) return null;

    return back.reverse();
};

/**
 * Build the replica at `want` (normally the WM's head). Without one, or when `want` cannot be
 * built, the highest head the log can build is used and `behind` says so.
 *
 * EVERY STEP IS CHECKED against the root its link names: a row that does not reproduce its own
 * root is corrupt, and serving from it would only get the device to refuse later, for a reason
 * that no longer points here.
 */
export const materialize = (links: readonly StoredLink[], want?: Head | null): Replica => {
    const trie = new WardTrie();
    const stored = new Map<Link, StoredLink>();
    for (const s of links) {
        const link = trie.record(
            {
                fromCounter: s.fromCounter,
                fromRoot: bytesOrNull(s.fromRoot),
                toCounter: s.toCounter,
                toRoot: bytesOrNull(s.toRoot),
                authCommit: toBytes(s.authCommit),
                operation: s.operation,
            },
            s.wmSig ? toBytes(s.wmSig) : undefined,
        );
        stored.set(link, s);
    }

    let head: Head = { counter: 0, root: null };
    let chain: Link[] | null = want ? chainTo(trie, want) : null;
    const behind = !!want && !chain;
    if (want && chain) {
        head = want;
    } else {
        const candidates = [...trie.links].sort((a, b) => b.toCounter - a.toCounter);
        chain = [];
        for (const c of candidates) {
            const reach = chainTo(trie, { counter: c.toCounter, root: c.toRoot });
            if (reach) {
                head = { counter: c.toCounter, root: c.toRoot };
                chain = reach;
                break;
            }
        }
    }

    for (const link of chain) {
        for (const change of stored.get(link)!.changes) {
            const entryKey = toBytes(change.entryKey);
            if (change.leaf) trie.set(entryKey, change.leaf);
            else trie.remove(entryKey);
        }
        if (!sameRoot(trie.root(), link.toRoot)) {
            throw new Error(
                `the stored link into counter ${link.toCounter} does not reproduce its root ` +
                    `(${toHex(link.toRoot ?? EMPTY_ROOT)})`,
            );
        }
    }
    trie.counter = head.counter;

    return { trie, head: { counter: head.counter, root: head.root }, behind };
};
