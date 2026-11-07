import {
    type BlobRow,
    type TreeState,
    type WardProvider,
    blobRows,
    computeRootFromBlobs,
    hydrate,
    traceLineage,
} from '@trezor/ward';

import type { Log } from './logging';
import { reconstructAvailable } from './recoveryReconstruction';
import { type SignedTransition, normalizeRoot } from './transition';

export const rebuildTrie = async (
    storage: WardProvider,
    wardId: string,
    head: TreeState | null,
    log: Log,
    history?: SignedTransition[],
): Promise<BlobRow[]> => {
    if (head && history?.some(record => record.kind === 'revert')) {
        const result = await reconstructAvailable({ storage, wardId, head, history, log });
        if (!result.complete) throw new Error('WARD trie recovery still has unavailable data');

        return result.blobs;
    }
    const root = head?.root ?? '';
    const counter = head?.counter ?? 0;
    log('trie.head', {
        source: 'replica',
        counter,
        root: root || 'EMPTY',
        mac: head?.mac ?? 'EMPTY',
    });
    let rows: BlobRow[];
    if (storage.getTransitions) {
        const transitions = await storage.getTransitions(wardId);
        log('trie.lineage.start', { counter, root: root || 'EMPTY', stored: transitions.length });
        let chain;
        try {
            chain = traceLineage(transitions, root, counter);
        } catch (error) {
            log('trie.lineage.failed', {
                counter,
                root: root || 'EMPTY',
                reason: error instanceof Error ? error.message : 'invalid history',
            });
            throw error;
        }
        log('trie.lineage', {
            order: 'head-to-genesis',
            stored: transitions.length,
            selected: chain.length,
        });
        for (const transition of chain) {
            log(
                'trie.transition',
                JSON.stringify({
                    counter: transition.counter,
                    fromCounter: transition.counter - 1,
                    prevRoot: transition.prevRoot || 'EMPTY',
                    targetRoot: transition.targetRoot || 'EMPTY',
                    targetRootMac: transition.targetRootMac ?? 'EMPTY',
                    leaves: transition.leaves,
                }),
            );
        }
        log('trie.genesis', { counter: 0, root: 'EMPTY' });
        log('trie.replay', { order: 'genesis-to-head', transitions: chain.length });
        rows = hydrate(transitions, root, counter, step => log('trie.replay.step', step)).blobs;
    } else {
        log('trie.lineage', { available: false, source: 'current-entries-snapshot' });
        rows = blobRows(await storage.getAllEntries(wardId));
    }
    for (const [index, row] of rows.entries()) log('trie.entry', JSON.stringify({ index, ...row }));
    log('trie.rebuild.start', { counter, entries: rows.length });
    const rebuiltRoot = normalizeRoot(computeRootFromBlobs(rows));
    log('trie.rebuild.complete', {
        counter,
        entries: rows.length,
        root: rebuiltRoot || 'EMPTY',
        expectedRoot: root || 'EMPTY',
        matches: rebuiltRoot === root,
    });
    if (rebuiltRoot !== root)
        throw new Error('WARD trie reconstruction does not match its checkpoint');

    return rows;
};
