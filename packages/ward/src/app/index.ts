/**
 * WARD application layer — the host-side "what data is requested/changed" flow.
 *
 * OWNS: resolving database state from a `WardProvider`, building normalized proof
 * packages, preparing a requested logical change, and persisting an accepted result.
 * Pure and transport-free — no device I/O, no WARD Manager, no Connect imports — so
 * it is unit-testable with `InMemoryWardDb` and reusable by any host.
 *
 * MUST NOT: authenticate or verify freshness. Whether the data is authentic/fresh is
 * the WARD flow's job (firmware, driven via `WardSession`). This layer only shapes
 * data; it returns normalized structures (hex strings), never device/protobuf objects.
 *
 * Reuses the proof primitives in `../proof` — it never reimplements hashing/proofs.
 */
import { bytesToHex } from '@noble/hashes/utils.js';

import type { BlobRow } from '../proof';
import { computeRootFromBlobs, entryToValueBytes } from '../proof';
import type { WardProvider } from '../storage';
import type {
    TreeState,
    WardEntry,
    WardLabel,
    WardLeafBlob,
    WardRow,
    WardTransition,
} from '../types';
/** Extract the device leaves (for by-entry_key proof serving) from stored rows.
 * Rows written before the keyed model (no blob) are skipped. Needs no key. */
export const blobRows = (rows: WardRow[]): BlobRow[] =>
    rows
        .filter(r => r.entry.blob !== undefined)
        .map(r => ({
            entryKeyHex: r.entry.blob!.entryKey,
            keyType: r.entry.blob!.keyType,
            identity: r.entry.blob!.identity,
            content: r.entry.blob!.content,
        }));
/** The host DB view for a ward: all rows + the stored root checkpoint. */
export type WardHeadState = { rows: WardRow[]; tree: TreeState | null };
export type WardChange = {
    op: 'insert' | 'update' | 'delete';
    newEntry: WardEntry;
    /** Empty string for a delete: an empty `new_value` is what makes the device do a
     * FULL delete (remove the leaf from the trie), rather than an update to some
     * "empty-looking" value. */
    newValueHex: string;
};
/** resolve_database_head: load all rows + the stored tree checkpoint for a ward. */
export const loadHead = async (provider: WardProvider, wardId: string): Promise<WardHeadState> => {
    const [rows, tree] = await Promise.all([
        provider.getAllEntries(wardId),
        provider.getTreeState(wardId),
    ]);

    return { rows, tree };
};
export type HydrateResult = { blobs: BlobRow[]; root: string; verifiedCounter: number };
/**
 * §7 reconstruction: reconstruct AND verify the MPT from the append-only transition log by
 * walking backward from `headRoot` (target_root → prev_root), then replaying forward
 * with a per-batch root check. Rejects a torn / tampered / incomplete lineage instead
 * of silently rebuilding a wrong root (the failure mode of a flat "rebuild from all
 * current rows" under unreliable/partial sync), and yields the `prev_root`s needed for
 * §8.2 rollback. Keyless by design — every check uses the public commit hashes; the
 * authenticity of `headRoot` itself is established by the device at reconcile (root
 * MAC), this proves the *contents* reconstruct to it.
 */
// FIXME(ward, UNWIRED): hydrate + resolveHead implement the §7 backward-walk
// reconstruction and per-batch root check, and they work (see __tests__/hydrate.test.ts)
// -- but resolveHead has no production caller. connect uses loadHead instead, so the
// `transitions` log written by wardUpdate is append-only-never-read. Wire resolveHead
// into the read path to make lineage verification actually run.
export const hydrate = (transitions: WardTransition[], headRoot: string): HydrateResult => {
    if (headRoot === '') return { blobs: [], root: '', verifiedCounter: 0 };
    const byTarget = new Map(transitions.map(t => [t.targetRoot, t]));
    // Backward walk head → genesis, following target_root → prev_root.
    const chain: WardTransition[] = [];
    const seen = new Set<string>();
    let cur = headRoot;
    while (cur !== '') {
        const t = byTarget.get(cur);
        if (!t) {
            throw new Error(
                `hydrate: no transition produces root ${cur} — lineage incomplete ` +
                    '(torn / not-yet-synced batch); cannot hydrate',
            );
        }
        if (seen.has(cur)) throw new Error(`hydrate: cycle in lineage at root ${cur}`);
        seen.add(cur);
        chain.push(t);
        cur = t.prevRoot;
    }
    chain.reverse(); // genesis → head
    // Forward replay with a per-batch root check + contiguity check. Each transition
    // applies its whole batch of leaves (order-independent — positions are keyed by
    // entry_key) before the single root check at its target.
    const leaves = new Map<string, BlobRow>();
    let prev = '';
    for (const t of chain) {
        if (t.prevRoot !== prev) {
            throw new Error(
                `hydrate: non-contiguous lineage at counter ${t.counter}: ` +
                    `prev_root ${t.prevRoot} != running root ${prev}`,
            );
        }
        for (const lf of t.leaves) {
            if (lf.content.bodyHex === '') {
                leaves.delete(lf.entryKey);
            } else {
                leaves.set(lf.entryKey, {
                    entryKeyHex: lf.entryKey,
                    keyType: lf.keyType,
                    identity: lf.identity,
                    content: lf.content,
                });
            }
        }
        const root = computeRootFromBlobs([...leaves.values()]);
        if (root !== t.targetRoot) {
            throw new Error(
                `hydrate: batch counter ${t.counter} replays to ${root} != target ` +
                    `${t.targetRoot} (malformed / incomplete batch)`,
            );
        }
        prev = t.targetRoot;
    }
    if (prev !== headRoot) throw new Error(`hydrate: reconstructed ${prev} != head ${headRoot}`);

    return {
        blobs: [...leaves.values()],
        root: headRoot,
        verifiedCounter: chain.at(-1)?.counter ?? 0,
    };
};
/**
 * Load the head and, when the provider keeps a transition log, VERIFY it via §7
 * the `hydrate` reconstruction path (rejecting torn/incomplete lineage) instead of trusting the flat current
 * row set. Falls back to `loadHead` for providers without a log.
 */
export const resolveHead = async (
    provider: WardProvider,
    wardId: string,
): Promise<{ rows: WardRow[]; tree: TreeState | null; hydrated?: HydrateResult }> => {
    const { rows, tree } = await loadHead(provider, wardId);
    if (provider.getTransitions === undefined || tree === null) return { rows, tree };
    const hydrated = hydrate(await provider.getTransitions(wardId), tree.root);

    return { rows, tree, hydrated };
};
/** resolve_database_entry: the current entry for (ward, address, network), or null. */
export const loadEntry = (
    provider: WardProvider,
    wardId: string,
    appId: string,
    address: string,
    networkSymbol: string,
): WardEntry | null | Promise<WardEntry | null> =>
    provider.lookup(wardId, appId, address, networkSymbol);
/**
 * build_lookup_proof_package: membership proof when `entry` is present, else a
 * non-membership (witness) proof. Returned normalized to hex. The witness is two
 * hashes only — it never carries another app's plaintext identifier or value.
 */
/**
 * application_prepare_update: classify insert/update, build the counter-free new
 * value bytes, and the OLD-state proof the device will pull at perform time.
 *
 * `currentCounter` yields only an OPTIMISTIC local stamp on `newEntry.counter`. The
 * device is the counter authority — persist the device-confirmed counter via
 * `commitLocal`, not this one.
 */
export const prepareChange = (
    oldEntry: WardEntry | null,
    networkSymbol: string,
    metadata: WardLabel,
    currentCounter: number,
    remove = false,
): WardChange => {
    const newEntry: WardEntry = { metadata, counter: currentCounter + 1 };
    // A DELETE must send an EMPTY new_value -- that is the device's delete sentinel.
    // Note `metadata: {}` does NOT delete: entryToValueBytes yields `${networkSymbol}:{}`
    // (e.g. "TEST:{}"), 7 non-empty bytes, so the device would UPDATE the leaf to that
    // literal string and the entry would survive as a tombstone. Deleting has to be
    // requested explicitly.
    if (remove) {
        return { op: 'delete', newEntry, newValueHex: '' };
    }

    return {
        op: oldEntry === null ? 'insert' : 'update',
        newEntry,
        newValueHex: bytesToHex(entryToValueBytes(networkSymbol, newEntry)),
    };
};
/**
 * application_persist_update: post-finalize local persistence. Writes the entry and
 * tree checkpoint using the DEVICE-confirmed counter — never a host guess.
 *
 * `deleted` is a FULL delete: the device removed the leaf from the trie (both leaf
 * parts come back empty), so the row is REMOVED rather than upserted with empty
 * metadata. Keeping it would leave `lookup` answering with stale metadata for an
 * entry the device can prove absent, and would put a blob-less row in front of
 * `blobRows`. Falls back to an empty upsert only if the provider predates `remove`.
 */
export const commitLocal = async (
    provider: WardProvider,
    wardId: string,
    appId: string,
    address: string,
    networkSymbol: string,
    metadata: WardLabel,
    installed: {
        counter: number;
        root?: string;
        rootMac?: string;
        blob?: WardLeafBlob;
        deleted?: boolean;
    },
): Promise<void> => {
    if (installed.deleted === true && provider.remove !== undefined) {
        await provider.remove(wardId, appId, address, networkSymbol);
    } else {
        await provider.upsert(wardId, appId, address, networkSymbol, {
            metadata,
            counter: installed.counter,
            ...(installed.blob !== undefined && { blob: installed.blob }),
        });
    }
    // The checkpoint ALWAYS advances after a confirmed device round -- including a
    // delete that empties the tree, where the device reports no root at all. The host's
    // canonical empty root is '' (what computeRootFromBlobs([]) returns), so skipping
    // the write here would leave tree_state pinned to the pre-delete root while the
    // device moved on: a silent desync that makes every later proof fail.
    await provider.setTreeState(wardId, {
        root: installed.root ?? '',
        counter: installed.counter,
        ...(installed.rootMac != null && { mac: installed.rootMac }),
    });
};
