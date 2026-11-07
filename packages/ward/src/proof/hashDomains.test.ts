import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, concatBytes, hexToBytes } from '@noble/hashes/utils.js';

import mockTrie from '../../mocks/mockTrie.json';

import { EMPTY_ROOT_HEX, commitOf, computeRootFromBlobs, leafValueBytes } from './index';

it('uses the Rust empty-root domain for an empty trie and after the last deletion', () => {
    expect(EMPTY_ROOT_HEX).toBe('dbc1b4c900ffe48d575b5da5c638040125f65db0fe3e24494b76ea986457d986');
    const rows = [...mockTrie.leaves];
    expect(computeRootFromBlobs(rows)).toBe(mockTrie.root);
    while (rows.length) rows.pop();
    expect(computeRootFromBlobs(rows)).toBe(EMPTY_ROOT_HEX);
});

it.each(mockTrie.leaves)('uses the Rust default value hash for $entryKeyHex', row => {
    const value = leafValueBytes(row.keyType, row.identity, row.content);
    expect(bytesToHex(value)).toBe(row.valueHex);
    const digest = commitOf(row.keyType, row.identity, row.content);
    expect(digest).toEqual(sha256(concatBytes(Uint8Array.of(0x03), hexToBytes(row.valueHex))));
    expect(digest).not.toEqual(sha256(concatBytes(Uint8Array.of(0x02), value)));
});
