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
    /** stored rows LEFT OUT because they do not reproduce their own root */
    corrupt: number;
}

const sameRoot = (a: Uint8Array | null, b: Uint8Array | null) =>
    equalBytes(a ?? EMPTY_ROOT, b ?? EMPTY_ROOT);

/** A root as the logs show it: the empty tree by name, any other by its first bytes. */
const showRoot = (root: Uint8Array | null) =>
    !root || equalBytes(root, EMPTY_ROOT) ? 'empty' : `${toHex(root).slice(0, 12)}…`;

const headKey = (counter: number, root: Uint8Array | null) =>
    `${counter}/${toHex(root ?? EMPTY_ROOT)}`;

/** Replay builds a revert from its target's leaves. The history served to devices
 * still records the actual transition from the manager's predecessor. */
const chainTo = (
    incoming: Map<string, Link>,
    stored: Map<Link, StoredLink>,
    head: Head,
): Link[] | null => {
    const back: Link[] = [];
    let { counter, root } = head;
    while (counter > 0) {
        const link = incoming.get(headKey(counter, root));
        if (!link || link.fromCounter >= counter || link.fromCounter < 0) return null;
        back.push(link);
        if (link.operation === 'revert') {
            const row = stored.get(link)!;
            const target = row.recoveredCounter;
            if (
                target === undefined ||
                !Number.isInteger(target) ||
                target < 0 ||
                target > link.fromCounter ||
                counter !== link.fromCounter + 1 ||
                row.changes.length
            ) {
                return null;
            }
            counter = target;
            root = link.toRoot;
        } else {
            counter = link.fromCounter;
            root = link.fromRoot;
        }
    }

    return counter === 0 && sameRoot(root, null) ? back.reverse() : null;
};

/** One attempt: the replica, or the first row on the chosen chain that is corrupt. */
const build = (
    links: readonly StoredLink[],
    want: Head | null | undefined,
    log: ((line: string) => void) | undefined,
): Omit<Replica, 'corrupt'> | { corrupt: StoredLink } => {
    const trie = new WardTrie();
    const stored = new Map<Link, StoredLink>();
    const incoming = new Map<string, Link>();
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
        incoming.set(headKey(link.toCounter, link.toRoot), link);
    }

    let head: Head = { counter: 0, root: null };
    let chain: Link[] | null = want ? chainTo(incoming, stored, want) : null;
    const behind = !!want && !chain;
    if (want && chain) {
        head = want;
    } else {
        const candidates = [...trie.links].sort((a, b) => b.toCounter - a.toCounter);
        chain = [];
        for (const c of candidates) {
            const reach = chainTo(incoming, stored, { counter: c.toCounter, root: c.toRoot });
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
        if (!sameRoot(trie.root(), link.toRoot)) return { corrupt: s };
    }
    trie.counter = head.counter;
    log?.(`rebuild: trie at #${head.counter}, root=${showRoot(trie.root())}, ${trie.size} leaves`);

    return { trie, head: { counter: head.counter, root: head.root }, behind };
};

/**
 * Build the replica at `want` (normally the WM's head). Without one, or when `want` cannot be
 * built, the highest head the log can build is used and `behind` says so.
 *
 * EVERY STEP IS CHECKED against the root its link names: a row that does not reproduce its own
 * root is corrupt, and serving from it would only get the device to refuse later, for a reason
 * that no longer points here. SUCH A ROW IS LEFT OUT, not fatal: one bad row -- a peer's bug, a
 * damaged write -- must not stop this host serving every valid head. The rebuild starts again
 * without it, so the head falls back to the next one that builds, and `corrupt` counts what was
 * dropped. Rows are replicated and append-only, so a dropped row is still there next time; it is
 * dropped again.
 */
export const materialize = (
    links: readonly StoredLink[],
    want?: Head | null,
    /** narrate the rebuild: the walk back to genesis, each step's entries, each root */
    log?: (line: string) => void,
): Replica => {
    const dropped = new Set<StoredLink>();
    for (;;) {
        const built = build(
            links.filter(s => !dropped.has(s)),
            want,
            log,
        );
        if (!('corrupt' in built)) return { ...built, corrupt: dropped.size };
        dropped.add(built.corrupt);
        const { toCounter, toRoot } = built.corrupt;
        // ALWAYS SAID, not only when narrating: a dropped row is a fault somewhere, not routine
        log?.(
            `rebuild: LEAVING OUT the stored link into #${toCounter} (root=${showRoot(bytesOrNull(toRoot))}): ` +
                'its changes do not reproduce its root; rebuilding without it',
        );
    }
};
