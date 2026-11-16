import { bytesToHex } from '@noble/hashes/utils.js';

import { type BlobRow, proofByKey, walkEntries } from '../proof';

// The entry feed for the device's verified listing walk (trezor_ward's Walk): entries in
// entry_key order, each proof cut below where it parts from the entry before.

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
const KEYS = ROWS.map(r => r.entryKeyHex).sort();

describe('walkEntries', () => {
    it('serves every entry in key order, the first with its full proof', () => {
        const entries = walkEntries(ROWS, null, 100);

        expect(entries.map(e => e.entryKeyHex)).toEqual(KEYS);
        expect(entries[0]?.proof).toEqual(proofByKey(ROWS, KEYS[0]!));
        // every later proof is a prefix (leaf-to-root) of the entry's full proof
        for (const entry of entries.slice(1)) {
            const full = proofByKey(ROWS, entry.entryKeyHex);
            expect(full.slice(0, entry.proof.length)).toEqual(entry.proof);
            expect(entry.proof.length).toBeLessThan(full.length);
        }
    });

    it('continues after an entry and honours the batch size', () => {
        expect(walkEntries(ROWS, null, 1).map(e => e.entryKeyHex)).toEqual([KEYS[0]]);
        expect(walkEntries(ROWS, KEYS[1]!, 100).map(e => e.entryKeyHex)).toEqual(KEYS.slice(2));
        expect(walkEntries(ROWS, KEYS[4]!, 100)).toEqual([]);
    });

    it('serves nothing after an unknown key or for an empty trie', () => {
        expect(walkEntries(ROWS, '00'.repeat(32))).toEqual([]);
        expect(walkEntries([], null)).toEqual([]);
    });
});
