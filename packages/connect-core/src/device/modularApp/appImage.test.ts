import { createHash } from 'crypto';

import { computeChunks, headerHash, parseAppImage, parseRootPacketTimestamp } from './appImage';

const sha256 = (data: Buffer) => createHash('sha256').update(data).digest();

// Independent reverse hash-chain, matching the device/trezorlib algorithm, used to derive a valid
// header chunk hash for the fixture.
const chainHash = (payload: Buffer, chunkSize: number) => {
    const chunks: Buffer[] = [];
    for (let i = 0; i < payload.length; i += chunkSize) {
        chunks.push(payload.subarray(i, i + chunkSize));
    }
    let hash: Buffer = Buffer.alloc(32);
    for (let i = chunks.length - 1; i >= 0; i--) {
        hash = sha256(Buffer.concat([hash, chunks[i] as Buffer]));
    }

    return hash;
};

const HEADER_SIZE = 512;
const CHUNK_SIZE = 8;

const buildImage = (payload: Buffer, overrides: { chunkHash?: Buffer } = {}) => {
    const header = Buffer.alloc(HEADER_SIZE);
    header.write('TRZA', 0, 'ascii');
    header.writeUInt32LE(HEADER_SIZE, 4);
    header.write('test.app', 8, 'utf-8');
    header.writeUInt8(1, 108); // version major
    header.writeUInt8(2, 109);
    header.writeUInt8(3, 110);
    header.writeUInt8(4, 111);
    header.writeUInt8(2, 118); // app ring
    (overrides.chunkHash ?? chainHash(payload, CHUNK_SIZE)).copy(header, 128);
    header.writeUInt16LE(CHUNK_SIZE, 160);

    return { header, binary: Buffer.concat([header, payload]) };
};

describe('modularApp/appImage', () => {
    const payload = Buffer.from(
        Array.from({ length: 20 }, (_, i) => i + 1), // 20 bytes -> chunks of [8, 8, 4]
    );

    it('parseAppImage reads header fields and splits header/payload', () => {
        const { header, binary } = buildImage(payload);
        const image = parseAppImage(binary);

        expect(image.id).toBe('test.app');
        expect(image.version).toEqual([1, 2, 3, 4]);
        expect(image.appRing).toBe(2);
        expect(image.chunkSize).toBe(CHUNK_SIZE);
        expect(image.headerBytes).toEqual(header);
        expect(image.payload).toEqual(payload);
    });

    it('parseAppImage rejects a bad magic', () => {
        const { binary } = buildImage(payload);
        binary.write('XXXX', 0, 'ascii');
        expect(() => parseAppImage(binary)).toThrow(/magic/);
    });

    it('computeChunks builds the reverse hash chain matching the header', () => {
        const { binary } = buildImage(payload);
        const image = parseAppImage(binary);
        const chunks = computeChunks(image.payload, image.chunkSize, image.chunkHash);

        expect(chunks).toHaveLength(3);
        const [c0, c1, c2] = chunks as [
            (typeof chunks)[number],
            (typeof chunks)[number],
            (typeof chunks)[number],
        ];
        // Last chunk pairs with the 32-byte zero seed.
        expect(c2.hash).toEqual(Buffer.alloc(32));
        // Each earlier hash is sha256(nextHash || nextChunk).
        expect(c1.hash).toEqual(sha256(Buffer.concat([c2.hash, c2.data])));
        expect(c0.hash).toEqual(sha256(Buffer.concat([c1.hash, c1.data])));
    });

    it('computeChunks throws when the payload hash does not match the header', () => {
        const { binary } = buildImage(payload, { chunkHash: Buffer.alloc(32, 0xff) });
        const image = parseAppImage(binary);
        expect(() => computeChunks(image.payload, image.chunkSize, image.chunkHash)).toThrow(
            /does not match/,
        );
    });

    it('headerHash hashes the raw header bytes', () => {
        const { header, binary } = buildImage(payload);
        const image = parseAppImage(binary);
        expect(headerHash(image.headerBytes)).toEqual(sha256(header));
    });

    it('parseRootPacketTimestamp reads the little-endian timestamp', () => {
        const rootPacket = Buffer.alloc(64);
        rootPacket.write('TRRP', 0, 'ascii');
        rootPacket.writeUInt32LE(1_700_000_000, 8);
        expect(parseRootPacketTimestamp(rootPacket)).toBe(1_700_000_000);
    });

    it('parseRootPacketTimestamp rejects a bad magic', () => {
        const rootPacket = Buffer.alloc(64);
        rootPacket.write('XXXX', 0, 'ascii');
        expect(() => parseRootPacketTimestamp(rootPacket)).toThrow(/magic/);
    });
});
