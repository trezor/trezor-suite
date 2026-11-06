import {
    type BlobRow,
    type TreeState,
    type WardProvider,
    computeRootFromBlobs,
} from '@trezor/ward';

import { type Log } from './logging';
import { type SignedTransition, normalizeRoot, verifyTransition } from './transition';

export type Reconstruction = {
    blobs: BlobRow[];
    counter: number;
    root: string;
    complete: boolean;
    missingCounter?: number;
};

type ReconstructParams = {
    storage: WardProvider;
    wardId: string;
    head: TreeState;
    history: SignedTransition[];
    log: Log;
};

/** Rebuild from authenticated WM lineage, retaining only data not undone by a revert. */
export const reconstructAvailable = async ({
    storage,
    wardId,
    head,
    history,
    log,
}: ReconstructParams): Promise<Reconstruction> => {
    const ordered = history.toSorted((left, right) => left.counter - right.counter);
    let counter = 0;
    let root = '';
    const effective: SignedTransition[] = [];
    for (const [index, record] of ordered.entries()) {
        verifyTransition(record);
        if (
            record.wardId !== wardId ||
            record.fromCounter !== counter ||
            normalizeRoot(record.fromRoot) !== root
        )
            throw new Error('recovery history is not a contiguous wallet chain');
        if (record.kind === 'revert') {
            const previous = ordered[index - 1];
            if (
                previous?.kind !== 'commit' ||
                normalizeRoot(record.root) !== normalizeRoot(previous.fromRoot) ||
                effective.at(-1)?.counter !== previous.counter
            )
                throw new Error('revert does not restore the immediate predecessor');
            effective.pop();
        } else {
            effective.push(record);
        }
        counter = record.counter;
        root = normalizeRoot(record.root);
    }
    if (counter !== head.counter || root !== head.root)
        throw new Error('recovery history does not terminate at the authoritative head');
    const stored = (await storage.getTransitions?.(wardId)) ?? [];
    log('trie.head', { source: 'WM', counter, root });
    log('trie.lineage', {
        order: 'head-to-genesis',
        selected: ordered.length,
        freshReconstruction: true,
    });
    for (const record of ordered.toReversed())
        log(
            'trie.transition',
            JSON.stringify({
                counter: record.counter,
                prevRoot: record.fromRoot,
                targetRoot: record.root,
                kind: record.kind,
            }),
        );
    log('trie.genesis', { counter: 0, root: 'EMPTY' });
    log('trie.replay', {
        order: 'genesis-to-head',
        transitions: ordered.length,
        dataTransitions: effective.length,
    });
    const dataCounters = new Set(effective.map(record => record.counter));
    for (const record of ordered)
        log('trie.replay.history-step', {
            counter: record.counter,
            kind: record.kind,
            fromRoot: record.fromRoot,
            root: record.root,
            dataRequired: dataCounters.has(record.counter),
        });
    let leaves = new Map<string, BlobRow>();
    root = '';
    for (const record of effective) {
        if (normalizeRoot(record.fromRoot) !== root)
            throw new Error('recovery data path is not contiguous');
        const matches = stored.filter(
            local =>
                local.counter === record.counter &&
                normalizeRoot(local.prevRoot) === normalizeRoot(record.fromRoot) &&
                normalizeRoot(local.targetRoot) === normalizeRoot(record.root) &&
                local.authCommit === record.authCommit &&
                local.sigCommit === record.signature &&
                local.targetRootMac === record.mac &&
                local.headNonce === record.headNonce &&
                (local.kind ?? 'commit') === record.kind,
        );
        const local = matches[0];
        if (
            matches.length > 1 &&
            matches.some(item => JSON.stringify(item) !== JSON.stringify(local))
        )
            throw new Error('ambiguous recovery data');
        const next = new Map(leaves);
        if (local)
            for (const leaf of local.leaves) {
                if (leaf.content.bodyHex === '') next.delete(leaf.entryKey);
                else
                    next.set(leaf.entryKey, {
                        entryKeyHex: leaf.entryKey,
                        keyType: leaf.keyType,
                        identity: leaf.identity,
                        content: leaf.content,
                    });
            }
        const rebuilt = local ? computeRootFromBlobs([...next.values()]) : undefined;
        if (!local || rebuilt === undefined || rebuilt !== normalizeRoot(record.root)) {
            log('trie.replay.unavailable', {
                counter: record.counter,
                verifiedCounter: record.fromCounter,
                root,
            });

            return {
                blobs: [...leaves.values()],
                counter: record.fromCounter,
                root,
                complete: false,
                missingCounter: record.counter,
            };
        }
        leaves = next;
        root = rebuilt;
        log('trie.replay.step', {
            counter: record.counter,
            root,
            matches: true,
            entries: leaves.size,
        });
    }
    log('trie.rebuild.start', {
        counter: head.counter,
        entries: leaves.size,
        freshReconstruction: true,
    });
    root = computeRootFromBlobs([...leaves.values()]);
    if (root !== head.root) throw new Error('recovery trie does not match the authoritative head');
    for (const [index, row] of [...leaves.values()].entries())
        log('trie.entry', JSON.stringify({ index, ...row }));
    log('trie.rebuild.complete', {
        counter: head.counter,
        root,
        entries: leaves.size,
        matches: true,
        freshReconstruction: true,
    });

    return { blobs: [...leaves.values()], counter: head.counter, root, complete: true };
};
