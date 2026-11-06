import { bytesToHex } from '@noble/hashes/utils.js';

import { type BlobRow, computeRootFromBlobs, nodesByHash } from '../proof';

// The node feed for the device's verified listing walk (firmware trie.TrieWalk): from any node
// hash, that node and its descendants in pre-order, so walking from the root reaches every leaf.

const part = (body: string) => ({
    encoding: 0,
    nonceHex: '01'.repeat(12),
    tagHex: '02'.repeat(16),
    bodyHex: body,
});
const row = (i: number): BlobRow => ({
    entryKeyHex: bytesToHex(Uint8Array.from({ length: 32 }, (_, j) => (i * 37 + j * 11) & 0xff)),
    keyType: 'address',
    identity: part(`aa0${i}`),
    content: part(`bb0${i}`),
});
const ROWS = [0, 1, 2, 3, 4].map(row);

describe('nodesByHash', () => {
    it('walks the whole trie from the root in pre-order', () => {
        const root = computeRootFromBlobs(ROWS);
        const nodes = nodesByHash(ROWS, root, 100);

        expect(nodes[0]?.kind).toBe('branch');
        // a full binary trie over n leaves has n - 1 branches
        expect(nodes.filter(n => n.kind === 'branch')).toHaveLength(ROWS.length - 1);
        expect(nodes.flatMap(n => (n.kind === 'leaf' ? [n.entryKeyHex] : [])).sort()).toEqual(
            ROWS.map(r => r.entryKeyHex).sort(),
        );
    });

    it('starts from any node and honours the batch size', () => {
        const root = computeRootFromBlobs(ROWS);
        const [first] = nodesByHash(ROWS, root, 1);
        if (first?.kind !== 'branch') throw new Error('the root of five leaves is a branch');

        expect(nodesByHash(ROWS, root, 1)).toHaveLength(1);
        const left = nodesByHash(ROWS, first.leftHex, 100);
        const right = nodesByHash(ROWS, first.rightHex, 100);
        expect(left.length + right.length + 1).toBe(nodesByHash(ROWS, root, 100).length);
    });

    it('serves nothing for an unknown hash or an empty trie', () => {
        expect(nodesByHash(ROWS, '00'.repeat(32))).toEqual([]);
        expect(nodesByHash([], '00'.repeat(32))).toEqual([]);
    });
});
