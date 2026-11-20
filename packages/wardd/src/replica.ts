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

/** A root as the logs show it: the empty tree by name, any other by its first bytes. */
const showRoot = (root: Uint8Array | null) =>
    !root || equalBytes(root, EMPTY_ROOT) ? 'empty' : `${toHex(root).slice(0, 12)}…`;

/** Genesis-to-head, oldest first; null if the walk back does not reach the empty tree at 0. */
const chainTo = (trie: WardTrie, head: Head): Link[] | null => {
    if (head.counter === 0) return sameRoot(head.root, null) ? [] : null;
    const back = trie.linksEndingAt(head.counter, head.root, Number.MAX_SAFE_INTEGER);
    const oldest = back[back.length - 1];
    if (oldest?.fromCounter !== 0 || !sameRoot(oldest.fromRoot, null)) return null;

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
export const materialize = (
    links: readonly StoredLink[],
    want?: Head | null,
    /** narrate the rebuild: the walk back to genesis, each step's entries, each root */
    log?: (line: string) => void,
): Replica => {
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

    if (log) {
        let source = ' (no WM head; highest buildable)';
        if (want)
            source = behind ? ' (the WM head cannot be built: rows missing)' : ' (the WM head)';
        log(
            `rebuild: ${links.length} stored transition(s); head #${head.counter}` +
                ` root=${showRoot(head.root)}${source}`,
        );
        // THE WALK BACK, as `chainTo` takes it: from the head, each link's `from` names the next
        for (const link of [...chain].reverse()) {
            const s = stored.get(link)!;
            log(
                `rebuild:   retrieved transition #${link.fromCounter} -> #${link.toCounter}` +
                    ` (${s.operation}, ${s.changes.length} entr${s.changes.length === 1 ? 'y' : 'ies'})` +
                    ` to root=${showRoot(link.toRoot)}`,
            );
        }
        log(`rebuild:   reached genesis: #0, empty tree`);
    }

    for (const link of chain) {
        const s = stored.get(link)!;
        log?.(`rebuild: applying #${link.fromCounter} -> #${link.toCounter}`);
        for (const change of s.changes) {
            const entryKey = toBytes(change.entryKey);
            if (change.leaf) trie.set(entryKey, change.leaf);
            else trie.remove(entryKey);
            log?.(
                `rebuild:   entry=${change.entryKey.slice(0, 12)}… ` +
                    (change.leaf
                        ? `put content=${toBytes(change.leaf.content ?? '').length}B`
                        : 'delete'),
            );
        }
        log?.(
            `rebuild:   root=${showRoot(trie.root())} (${trie.size} leaves)` +
                (sameRoot(trie.root(), link.toRoot) ? ', matches the stored transition' : ''),
        );
        if (!sameRoot(trie.root(), link.toRoot)) {
            throw new Error(
                `the stored link into counter ${link.toCounter} does not reproduce its root ` +
                    `(${toHex(link.toRoot ?? EMPTY_ROOT)})`,
            );
        }
    }
    trie.counter = head.counter;
    log?.(`rebuild: trie at #${head.counter}, root=${showRoot(trie.root())}, ${trie.size} leaves`);

    return { trie, head: { counter: head.counter, root: head.root }, behind };
};
