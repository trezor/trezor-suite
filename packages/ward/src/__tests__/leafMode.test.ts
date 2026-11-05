import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, concatBytes, hexToBytes } from '@noble/hashes/utils.js';

import { EMPTY_PART, ENC_ENCRYPTED, ENC_PLAINTEXT, commitOf, computeRootFromBlobs } from '../proof';
import type { BlobRow, LeafPart } from '../proof';

// len8 / len32 big-endian, mirroring proof/index.ts.
const len8 = (n: number) => new Uint8Array([n & 0xff]);
const len32 = (n: number) => {
    const b = new Uint8Array(4);
    new DataView(b.buffer).setUint32(0, n, false);

    return b;
};

const utf8 = (s: string) => new TextEncoder().encode(s);

// Independent re-implementation of the part/commit framing, so the test pins the
// BYTES rather than just agreeing with the implementation it is testing.
const partBytes = (p: LeafPart) =>
    concatBytes(
        new Uint8Array([p.encoding]),
        len8(hexToBytes(p.nonceHex).length),
        hexToBytes(p.nonceHex),
        len8(hexToBytes(p.tagHex).length),
        hexToBytes(p.tagHex),
        len32(hexToBytes(p.bodyHex).length),
        hexToBytes(p.bodyHex),
    );

const expectedCommit = (keyType: string, identity: LeafPart, content: LeafPart) => {
    const kt = utf8(keyType);
    const id = partBytes(identity);
    const val = partBytes(content);

    return bytesToHex(
        sha256(
            concatBytes(
                new Uint8Array([0x02]),
                len8(kt.length),
                kt,
                len32(id.length),
                id,
                len32(val.length),
                val,
            ),
        ),
    );
};

// A plaintext content body = C_leaf(4B) || len32(value) || value. (The identifier used
// to live here; it is in the identity part now.)
const packContent = (cLeaf: number, value: Uint8Array) => {
    const c = new Uint8Array(4);
    new DataView(c.buffer).setUint32(0, cLeaf, false);

    return concatBytes(c, len32(value.length), value);
};

// A plaintext identity body = len16(id) || id || len8(app_id) || app_id || device_id(1B).
const packIdentity = (identifier: Uint8Array, appId: string, deviceId: number) => {
    const il = new Uint8Array(2);
    new DataView(il.buffer).setUint16(0, identifier.length, false);

    return concatBytes(il, identifier, len8(utf8(appId).length), utf8(appId), len8(deviceId));
};

const sealed = (nonceHex: string, tagHex: string, bodyHex: string): LeafPart => ({
    encoding: ENC_ENCRYPTED,
    nonceHex,
    tagHex,
    bodyHex,
});

const clear = (bodyHex: string): LeafPart => ({
    encoding: ENC_PLAINTEXT,
    nonceHex: '',
    tagHex: '',
    bodyHex,
});

describe('WARD two-part leaf commit — host mirror of service.py / ward_crypto', () => {
    const identity = sealed('11'.repeat(12), '22'.repeat(16), 'deadbeef');
    const content = sealed('33'.repeat(12), '44'.repeat(16), 'cafebabe');

    it('commits both parts and the clear key_type', () => {
        expect(bytesToHex(commitOf('address', identity, content))).toBe(
            expectedCommit('address', identity, content),
        );
    });

    it('is sensitive to key_type, to either part, and to any byte of either', () => {
        const base = bytesToHex(commitOf('address', identity, content));

        expect(bytesToHex(commitOf('label', identity, content))).not.toBe(base);
        expect(bytesToHex(commitOf('address', EMPTY_PART, content))).not.toBe(base);
        expect(bytesToHex(commitOf('address', identity, EMPTY_PART))).not.toBe(base);
        expect(
            bytesToHex(commitOf('address', identity, { ...content, bodyHex: 'cafebabf' })),
        ).not.toBe(base);
        // swapping the two parts must not collide either
        expect(bytesToHex(commitOf('address', content, identity))).not.toBe(base);
    });

    it('domain-separates the encodings: same bytes, different encoding byte', () => {
        // The encoding byte is INSIDE the commit, so a host cannot present a sealed
        // part as plaintext (or vice versa) without changing the leaf.
        const asSealed = bytesToHex(commitOf('address', sealed('', '', 'deadbeef'), content));
        const asClear = bytesToHex(commitOf('address', clear('deadbeef'), content));

        expect(asSealed).not.toBe(asClear);
    });

    it('all four encoding combinations commit distinctly', () => {
        const idBody = bytesToHex(packIdentity(utf8('addr'), 'bitcoin', 0));
        const valBody = bytesToHex(packContent(7, utf8('val')));
        const commits = new Set(
            (
                [
                    [
                        sealed('11'.repeat(12), '22'.repeat(16), idBody),
                        sealed('33'.repeat(12), '44'.repeat(16), valBody),
                    ],
                    [sealed('11'.repeat(12), '22'.repeat(16), idBody), clear(valBody)],
                    [clear(idBody), sealed('33'.repeat(12), '44'.repeat(16), valBody)],
                    [clear(idBody), clear(valBody)],
                ] as [LeafPart, LeafPart][]
            ).map(([i, c]) => bytesToHex(commitOf('address', i, c))),
        );

        expect(commits.size).toBe(4);
    });

    it('a plaintext part is readable with no key, and still commits identically', () => {
        // §3.10: sealing is a per-part deployment choice, not a property of the format.
        const idBody = packIdentity(utf8('addr'), 'bitcoin', 3);
        const part = clear(bytesToHex(idBody));

        expect(hexToBytes(part.bodyHex)).toEqual(idBody);
        expect(bytesToHex(commitOf('address', part, content))).toBe(
            expectedCommit('address', part, content),
        );
    });

    it('computeRootFromBlobs is keyless and mode-agnostic in shape', () => {
        const rows: BlobRow[] = [0, 1, 2].map(i => ({
            entryKeyHex: bytesToHex(sha256(new Uint8Array([i]))),
            keyType: 'address',
            identity: clear(bytesToHex(packIdentity(utf8(`id${i}`), 'bitcoin', 0))),
            content: clear(bytesToHex(packContent(1000 + i, new Uint8Array([i])))),
        }));

        const root = computeRootFromBlobs(rows);
        expect(root).toHaveLength(64);

        // Re-encoding one row's identity as sealed changes the root — the commit covers
        // the encoding, so a mode flip is never silent.
        const first = rows[0]!;
        const flipped: BlobRow[] = [
            { ...first, identity: { ...first.identity, encoding: ENC_ENCRYPTED } },
            ...rows.slice(1),
        ];
        expect(computeRootFromBlobs(flipped)).not.toBe(root);
    });

    it('an empty content body is the delete sentinel, identity survives it', () => {
        const idBody = clear(bytesToHex(packIdentity(utf8('gone'), 'bitcoin', 0)));
        const tombstone = commitOf('address', idBody, EMPTY_PART);

        expect(bytesToHex(tombstone)).toBe(expectedCommit('address', idBody, EMPTY_PART));
        // the tombstone is still self-describing: the identity part is intact
        expect(idBody.bodyHex).not.toBe('');
    });
});
