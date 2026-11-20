/**
 * The host's answers to the device, and applying what the device hands back -- in wire (JSON,
 * bytes as hex) form, so a relay can pass them through unchanged. Mirrors `trezorlib.ward`
 * (`store_provider`, `apply`, `_apply_batch`) and `TransitionLog.links_ending_at`.
 */
import { type BytesLike, equalBytes, toBytes, toHex } from './bytes';
import { OP_COMMIT, type WardLeaf, type WardTrie } from './store';
import { EMPTY_ROOT } from './trie';

/** WardEntryRequest, as it arrives: the path, and (batched flush only) the change just folded. */
export interface WardEntryRequestJson {
    entry_key?: string | null;
    staged?: { entry_key?: string | null; commit?: string | null } | null;
}

export interface WardEntryAckJson {
    // absent = no such entry; a read never needs the identity
    sealed_content?: string | null;
    proof: string[];
    witness_entry_key?: string;
    witness_commit?: string;
}

/**
 * Answer one pull. `staged` is CUMULATIVE for the conversation: every change a batched flush has
 * folded so far, so the proof matches the device's RUNNING root, not the stored one.
 */
export const serveEntry = (
    store: WardTrie,
    request: WardEntryRequestJson,
    staged: readonly [Uint8Array, Uint8Array][] = [],
): WardEntryAckJson => {
    const view = staged.length ? store.scratch(staged) : store;
    const entryKey = toBytes(request.entry_key ?? '');
    if (view.has(entryKey)) {
        const blob = view.blobs.get(toHex(entryKey));

        return {
            sealed_content: toHex(toBytes(blob?.content)),
            proof: view.membershipProof(entryKey).map(toHex),
        };
    }
    const [proof, witnessKey, witnessCommit] = view.nonmembershipProof(entryKey);

    return {
        proof: proof.map(toHex),
        ...(witnessKey ? { witness_entry_key: toHex(witnessKey) } : {}),
        ...(witnessCommit ? { witness_commit: toHex(witnessCommit) } : {}),
    };
};

export interface WardChainLinkJson {
    from_counter: number;
    from_root?: string;
    to_counter: number;
    to_root?: string;
    auth_commit: string;
}

/** Answer a WardChainRequest: up to `limit` links ending at that state, newest first. */
export const serveChain = (
    store: WardTrie,
    toCounter: number,
    toRoot: BytesLike | null | undefined,
    limit = 64,
): WardChainLinkJson[] =>
    store.linksEndingAt(toCounter, toRoot ? toBytes(toRoot) : null, limit).map(link => ({
        from_counter: link.fromCounter,
        ...(link.fromRoot ? { from_root: toHex(link.fromRoot) } : {}),
        to_counter: link.toCounter,
        ...(link.toRoot ? { to_root: toHex(link.toRoot) } : {}),
        // the wire carries the transition and its authorisation, never the operation
        auth_commit: toHex(link.authCommit),
    }));

/** An empty sealed content is a deletion. */
export const leafIsDelete = (leaf: WardLeaf | null | undefined): boolean =>
    !toBytes(leaf?.content).length;

/** A leaf as the device hands it over on the wire. */
export interface WardLeafJson {
    sealed_identity?: string | null;
    sealed_content?: string | null;
}

export const leafFromWire = (wire: WardLeafJson): WardLeaf => ({
    identity: wire.sealed_identity ?? null,
    content: wire.sealed_content ?? null,
});

/** WardLeafAck / a single-leaf WardFlushQueueAck, as the device sends it. */
export interface WardResultJson extends WardLeafJson {
    entry_key?: string | null;
    counter?: number | null;
    auth_commit?: string | null;
    wm_sig?: string | null;
    // batched WardFlushQueueAck only
    from_counter?: number | null;
    leaves?: ({ entry_key?: string | null } & WardLeafJson)[];
}

/**
 * Apply a confirmed write, delete or batch to the store and record ONE link. A real host runs this
 * as ONE local transaction and publishes to the WM only after it commits.
 */
export const applyResult = (store: WardTrie, result: WardResultJson): void => {
    const before = { counter: store.counter, root: store.root() };
    if (!result.auth_commit) {
        // An idempotent delete of an absent path: no transition was made, so nothing to apply --
        // unless the store disagrees, which must be said, not papered over.
        if (result.entry_key && store.has(toBytes(result.entry_key))) {
            throw new Error('device reports no change but the store still holds this entry');
        }
        if (result.counter != null) store.counter = result.counter;

        return;
    }
    if (result.counter == null) throw new Error('a transition result must carry its counter');

    if (result.leaves?.length) {
        if (store.counter !== result.from_counter) {
            throw new Error(
                `this batch starts at counter ${result.from_counter} but the store is at ${store.counter}`,
            );
        }
        for (const leaf of result.leaves) {
            const entryKey = toBytes(leaf.entry_key ?? '');
            if (leafIsDelete(leafFromWire(leaf))) store.remove(entryKey);
            else store.set(entryKey, leafFromWire(leaf));
        }
    } else {
        const entryKey = toBytes(result.entry_key ?? '');
        if (leafIsDelete(leafFromWire(result))) store.remove(entryKey);
        else store.set(entryKey, leafFromWire(result));
    }
    store.record(
        {
            fromCounter: result.leaves?.length ? result.from_counter! : before.counter,
            fromRoot: before.root,
            toCounter: result.counter,
            toRoot: store.root(),
            authCommit: toBytes(result.auth_commit),
            operation: OP_COMMIT,
        },
        result.wm_sig ? toBytes(result.wm_sig) : undefined,
    );
    store.counter = result.counter;
};

/** Whether the store's head is the given (counter, root) -- `null` / EMPTY_ROOT both mean empty. */
export const storeIsAt = (store: WardTrie, counter: number, root: BytesLike | null): boolean =>
    store.counter === counter &&
    equalBytes(store.root() ?? EMPTY_ROOT, root ? toBytes(root) : EMPTY_ROOT);
