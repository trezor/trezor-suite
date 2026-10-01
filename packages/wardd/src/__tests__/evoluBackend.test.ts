/**
 * The Evolu backend for real (in-memory SQLite): a link round-trips whole, the same link stored
 * twice is one row, and the WARD owner is its own -- not Suite's, and not another wallet's.
 */
import { randomBytes } from '@noble/hashes/utils.js';

import { toHex } from '@trezor/ward-core';

import { type StoredLink } from '../backend';
import { EvoluWardBackend, wardOwner, wardOwnerSecret } from '../evoluBackend';

const link = (toCounter: number): StoredLink => ({
    fromCounter: toCounter - 1,
    fromRoot: null,
    toCounter,
    toRoot: toHex(randomBytes(32)),
    authCommit: toHex(randomBytes(32)),
    operation: 'commit',
    wmSig: toHex(randomBytes(64)),
    changes: [
        {
            entryKey: toHex(randomBytes(32)),
            leaf: { content: { encoding: 1, plaintext: { content: 'aa' } } },
        },
        { entryKey: toHex(randomBytes(32)), leaf: null },
    ],
});

describe('EvoluWardBackend', () => {
    it('stores a link whole, once', async () => {
        const backend = await EvoluWardBackend.open({
            wardId: randomBytes(32),
            evoluNode: toHex(randomBytes(64)),
            dataDir: null,
        });
        try {
            const one = link(1);
            const two = link(2);
            await backend.append(one);
            await backend.append(two);
            await backend.append(one);
            const loaded = await backend.load();
            expect(loaded).toHaveLength(2);
            expect(loaded).toEqual(expect.arrayContaining([one, two]));
        } finally {
            await backend.close();
        }
    });

    it("derives the WARD owner as a child of the wallet's Evolu node", () => {
        const node = randomBytes(64);
        const secret = wardOwnerSecret(toHex(node));
        expect(secret).toHaveLength(32);
        // not Suite's owner secret (the node's first half), and stable
        expect(toHex(secret)).not.toBe(toHex(node.slice(0, 32)));
        expect(wardOwnerSecret(toHex(node))).toEqual(secret);
        expect(wardOwner(secret).id).not.toBe(wardOwner(node.slice(0, 32)).id);
        expect(() => wardOwnerSecret(toHex(randomBytes(32)))).toThrow('64-byte');
    });
});
