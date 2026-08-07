import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, concatBytes, hexToBytes } from '@noble/hashes/utils.js';

import { commitOf, computeRootFromBlobs, wardLeafMode } from '../proof';

// len32 big-endian, mirroring proof/index.ts.
const len32 = (n: number) => {
    const b = new Uint8Array(4);
    new DataView(b.buffer).setUint32(0, n, false);

    return b;
};

// A plaintext leaf `content` = C_leaf(4B) || len16(id) || id || len32(value) || value.
const packLeaf = (cLeaf: number, id: Uint8Array, value: Uint8Array) => {
    const c = new Uint8Array(4);
    new DataView(c.buffer).setUint32(0, cLeaf, false);
    const il = new Uint8Array(2);
    new DataView(il.buffer).setUint16(0, id.length, false);

    return concatBytes(c, il, id, len32(value.length), value);
};

describe('WARD leaf mode (encrypted <-> plaintext) — host mirror', () => {
    afterEach(() => {
        wardLeafMode.plaintext = false; // never leak mode across tests
    });

    it('commitOf is domain-separated by mode (0x02 vs 0x04)', () => {
        const nonce = new Uint8Array(12).fill(0x11);
        const tag = new Uint8Array(16).fill(0x22);
        const ct = hexToBytes('deadbeef');

        wardLeafMode.plaintext = false;
        expect(bytesToHex(commitOf(nonce, tag, ct))).toBe(
            bytesToHex(
                sha256(concatBytes(new Uint8Array([0x02]), nonce, tag, len32(ct.length), ct)),
            ),
        );

        // plaintext: nonce/tag empty, ct == packed content, tag byte 0x04.
        const content = packLeaf(
            7,
            new TextEncoder().encode('addr'),
            new TextEncoder().encode('val'),
        );
        const empty = new Uint8Array(0);
        wardLeafMode.plaintext = true;
        expect(bytesToHex(commitOf(empty, empty, content))).toBe(
            bytesToHex(sha256(concatBytes(new Uint8Array([0x04]), len32(content.length), content))),
        );

        // The two encodings of the same bytes must never collide.
        wardLeafMode.plaintext = false;
        const asEnc = bytesToHex(commitOf(empty, empty, content));
        wardLeafMode.plaintext = true;
        const asPt = bytesToHex(commitOf(empty, empty, content));
        expect(asEnc).not.toBe(asPt);
    });

    it('computeRootFromBlobs over the same blobs differs by mode', () => {
        const blobs = [0, 1, 2].map(i => ({
            entryKeyHex: bytesToHex(sha256(new Uint8Array([i]))),
            nonceHex: '',
            tagHex: '',
            ctHex: bytesToHex(
                packLeaf(1000 + i, new TextEncoder().encode(`id${i}`), new Uint8Array([i])),
            ),
            entryType: 'address',
        }));

        wardLeafMode.plaintext = false;
        const encRoot = computeRootFromBlobs(blobs);
        wardLeafMode.plaintext = true;
        const ptRoot = computeRootFromBlobs(blobs);

        expect(encRoot).not.toBe(ptRoot);
        expect(encRoot).toHaveLength(64);
        expect(ptRoot).toHaveLength(64);
    });
});
