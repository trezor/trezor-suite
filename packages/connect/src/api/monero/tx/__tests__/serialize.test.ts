import {
    ByteReader,
    ByteWriter,
    readUVarint,
    readUint,
    uvarintSize,
    writeUVarint,
    writeUint,
} from '../serialize';

const hexOf = (writer: ByteWriter) =>
    Array.from(writer.toUint8Array(), b => b.toString(16).padStart(2, '0')).join('');

const bytesOf = (value: bigint) => {
    const writer = new ByteWriter();
    writeUVarint(writer, value);

    return Array.from(writer.toUint8Array());
};

describe('monero serialize: uvarint', () => {
    // Known CryptoNote varint vectors (LEB128, little-endian 7-bit groups, 0x80 = continuation).
    it.each([
        [0n, [0x00]],
        [1n, [0x01]],
        [127n, [0x7f]],
        [128n, [0x80, 0x01]],
        [255n, [0xff, 0x01]],
        [300n, [0xac, 0x02]],
        [16384n, [0x80, 0x80, 0x01]],
    ])('encodes %s', (value, expected) => {
        expect(bytesOf(value)).toEqual(expected);
    });

    it('reports the encoded size', () => {
        expect(uvarintSize(0n)).toBe(1);
        expect(uvarintSize(127n)).toBe(1);
        expect(uvarintSize(128n)).toBe(2);
        expect(uvarintSize(16384n)).toBe(3);
    });

    it('round-trips 64-bit amounts (piconero range)', () => {
        const values = [0n, 1n, 1_000_000_000_000n, 18_446_744_073_709_551_615n]; // up to 2^64 - 1
        for (const value of values) {
            const writer = new ByteWriter();
            writeUVarint(writer, value);
            expect(uvarintSize(value)).toBe(writer.length);
            expect(readUVarint(new ByteReader(writer.toUint8Array()))).toBe(value);
        }
    });

    it('rejects negative values', () => {
        expect(() => writeUVarint(new ByteWriter(), -1n)).toThrow();
        expect(() => uvarintSize(-1n)).toThrow();
    });
});

describe('monero serialize: fixed-width uint', () => {
    it('encodes little-endian', () => {
        const writer = new ByteWriter();
        writeUint(writer, 258n, 2); // 0x0102
        expect(hexOf(writer)).toBe('0201');
    });

    it('round-trips fixed widths', () => {
        for (const [value, width] of [
            [0n, 8],
            [1n, 8],
            [255n, 1],
            [4_294_967_295n, 4],
            [18_446_744_073_709_551_615n, 8],
        ] as const) {
            const writer = new ByteWriter();
            writeUint(writer, value, width);
            expect(writer.length).toBe(width);
            expect(readUint(new ByteReader(writer.toUint8Array()), width)).toBe(value);
        }
    });
});

describe('monero serialize: ByteReader bounds', () => {
    it('throws past the end', () => {
        const reader = new ByteReader(new Uint8Array([0x01]));
        expect(reader.readByte()).toBe(0x01);
        expect(() => reader.readByte()).toThrow();
    });
});
