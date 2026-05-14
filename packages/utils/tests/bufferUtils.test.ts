import { bufferToBytes, getChunkSize, reverseBuffer, toNonSharedBuffer } from '../src/bufferUtils';

describe(reverseBuffer.name, () => {
    it('reverses a buffer by bytes', () => {
        expect(reverseBuffer(Buffer.from('abcd', 'hex'))).toEqual(Buffer.from('cdab', 'hex'));

        expect(
            reverseBuffer(
                Buffer.from(
                    '0dac366fd8a67b2a89fbb0d31086e7acded7a5bbf9ef9daa935bc873229ef5b5',
                    'hex',
                ),
            ).toString('hex'),
        ).toEqual('b5f59e2273c85b93aa9deff9bba5d7deace78610d3b0fb892a7ba6d86f36ac0d');
    });
});

describe(getChunkSize.name, () => {
    it('returns a single-byte buffer containing the given value', () => {
        const result = getChunkSize(5);

        expect(result).toHaveLength(1);
        expect(result[0]).toBe(5);
    });

    it('handles boundary value 0', () => {
        expect(getChunkSize(0)[0]).toBe(0);
    });

    it('handles boundary value 255 (max UInt8)', () => {
        expect(getChunkSize(255)[0]).toBe(255);
    });
});

describe(bufferToBytes.name, () => {
    it('returns an ArrayBuffer with the same bytes as the input buffer', () => {
        const buffer = Buffer.from([0x01, 0x02, 0x03]) as Buffer<ArrayBuffer>;
        const result = bufferToBytes(buffer);

        expect(result).toBeInstanceOf(ArrayBuffer);
        expect(new Uint8Array(result)).toEqual(new Uint8Array([0x01, 0x02, 0x03]));
    });

    it('handles an empty buffer', () => {
        const buffer = Buffer.alloc(0) as Buffer<ArrayBuffer>;
        const result = bufferToBytes(buffer);

        expect(result).toBeInstanceOf(ArrayBuffer);
        expect(result.byteLength).toBe(0);
    });

    it('returns only the slice corresponding to the buffer when byteOffset is non-zero', () => {
        const underlying = new ArrayBuffer(5);
        new Uint8Array(underlying).set([0xaa, 0xbb, 0xcc, 0xdd, 0xee]);
        // Create a view starting at byte 1 with length 3 → [0xbb, 0xcc, 0xdd]
        const buffer = Buffer.from(underlying, 1, 3) as Buffer<ArrayBuffer>;
        const result = bufferToBytes(buffer);

        expect(result.byteLength).toBe(3);
        expect(new Uint8Array(result)).toEqual(new Uint8Array([0xbb, 0xcc, 0xdd]));
    });
});

describe(toNonSharedBuffer.name, () => {
    it('returns the very same buffer reference when backed by a plain ArrayBuffer', () => {
        const input = Buffer.from([1, 2, 3]) as Buffer<ArrayBufferLike>;
        const result = toNonSharedBuffer(input);

        expect(result.buffer).toBe(input.buffer);
    });

    it('copies data into a new plain ArrayBuffer when backed by a SharedArrayBuffer', () => {
        const shared = new SharedArrayBuffer(3);
        const input = Buffer.from(shared) as Buffer<ArrayBufferLike>;
        input[0] = 0xaa;
        input[1] = 0xbb;
        input[2] = 0xcc;

        const result = toNonSharedBuffer(input);

        expect(result.buffer).toBeInstanceOf(ArrayBuffer);
        expect(result.buffer).not.toBe(shared);
        expect(Array.from(result)).toEqual([0xaa, 0xbb, 0xcc]);
    });
});
