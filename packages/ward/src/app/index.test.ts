import { type BlobRow, computeRootFromBlobs } from '../proof';
import type { WardTransition } from '../types';

import { hydrate, traceLineage } from './index';

const part = (bodyHex: string) => ({
    encoding: 0,
    nonceHex: '01'.repeat(12),
    tagHex: '02'.repeat(16),
    bodyHex,
});
const a: BlobRow = {
    entryKeyHex: '11'.repeat(32),
    keyType: 'address',
    identity: part('aa'),
    content: part('bb'),
};
const b: BlobRow = {
    entryKeyHex: '22'.repeat(32),
    keyType: 'address',
    identity: part('cc'),
    content: part('dd'),
};
const leaf = (row: BlobRow, remove = false) => ({
    entryKey: row.entryKeyHex,
    keyType: row.keyType,
    identity: row.identity,
    content: remove ? part('') : row.content,
});
const rootA = computeRootFromBlobs([a]);
const rootAB = computeRootFromBlobs([a, b]);
const history: WardTransition[] = [
    { counter: 1, prevRoot: '', targetRoot: rootA, leaves: [leaf(a)] },
    { counter: 2, prevRoot: rootA, targetRoot: rootAB, leaves: [leaf(b)] },
    { counter: 3, prevRoot: rootAB, targetRoot: rootA, leaves: [leaf(b, true)] },
    { counter: 4, prevRoot: rootA, targetRoot: '', leaves: [leaf(a, true)] },
    { counter: 5, prevRoot: '', targetRoot: rootA, leaves: [leaf(a)] },
];

it('walks by counter and root when deletion restores an earlier root', () => {
    expect(traceLineage(history, rootA, 3).map(transition => transition.counter)).toEqual([
        3, 2, 1,
    ]);
    expect(hydrate(history, rootA, 3)).toMatchObject({
        root: rootA,
        verifiedCounter: 3,
        blobs: [a],
    });
});

it('walks through an empty checkpoint and reaches the actual genesis', () => {
    expect(traceLineage(history, rootA, 5).map(transition => transition.counter)).toEqual([
        5, 4, 3, 2, 1,
    ]);
    expect(hydrate(history, '', 4)).toEqual({ root: '', verifiedCounter: 4, blobs: [] });
});

it('reports computed replay roots in genesis-to-head order', () => {
    const replay: number[] = [];
    hydrate(history, rootA, 5, step => {
        expect(step.matches).toBe(true);
        expect(step.root).toBe(step.expectedRoot);
        replay.push(step.counter);
    });
    expect(replay).toEqual([1, 2, 3, 4, 5]);
});

it('rejects missing history and an ambiguous checkpoint', () => {
    expect(() =>
        hydrate(
            history.filter(transition => transition.counter !== 2),
            rootA,
            5,
        ),
    ).toThrow('lineage incomplete');
    expect(() => hydrate([...history, history[2]!], rootA, 3)).toThrow('ambiguous lineage');
});
