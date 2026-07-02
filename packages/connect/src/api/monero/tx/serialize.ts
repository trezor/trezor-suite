// Monero / CryptoNote binary serialization primitives.
//
// Faithful port of the reference host-side serializer ph4r05/monero-serialize
// (core/int_serialize.py). These are the foundation of Monero transaction serialization, which is
// consensus-critical: the assembled transaction must be byte-identical to what monerod expects.
//
// `uvarint` is CryptoNote's variable-length integer (LEB128): 7 payload bits per byte, the high bit
// (0x80) marks "more bytes follow", little-endian group order. Monero amounts span the full 2^64
// range, larger than JS's safe-integer limit, so all values are `bigint`.

export class ByteWriter {
    private readonly bytes: number[] = [];

    writeByte(value: number): void {
        this.bytes.push(value & 0xff);
    }

    writeBytes(values: Uint8Array | readonly number[]): void {
        for (const value of values) {
            this.bytes.push(value & 0xff);
        }
    }

    get length(): number {
        return this.bytes.length;
    }

    toUint8Array(): Uint8Array {
        return Uint8Array.from(this.bytes);
    }
}

export class ByteReader {
    private offset = 0;

    constructor(private readonly buffer: Uint8Array) {}

    readByte(): number {
        if (this.offset >= this.buffer.length) {
            throw new Error('ByteReader: unexpected end of buffer');
        }

        // noUncheckedIndexedAccess: bounds checked directly above.
        return this.buffer[this.offset++] as number;
    }

    readBytes(length: number): Uint8Array {
        if (this.offset + length > this.buffer.length) {
            throw new Error('ByteReader: unexpected end of buffer');
        }
        const slice = this.buffer.subarray(this.offset, this.offset + length);
        this.offset += length;

        return slice;
    }

    get remaining(): number {
        return this.buffer.length - this.offset;
    }
}

/** Number of bytes `value` occupies when serialized as a uvarint. Matches `uvarint_size`. */
export const uvarintSize = (value: bigint): number => {
    if (value < 0n) {
        throw new Error('uvarint cannot be negative');
    }
    let bytes = value !== 0n ? 0 : 1;
    let n = value;
    while (n > 0n) {
        n >>= 7n;
        bytes += 1;
    }

    return bytes;
};

/** Append `value` as a uvarint. Mirrors `dump_uvarint_b_into`. */
export const writeUVarint = (writer: ByteWriter, value: bigint): void => {
    if (value < 0n) {
        throw new Error('uvarint cannot be negative');
    }
    let n = value;
    for (;;) {
        const shifted = n >> 7n;
        writer.writeByte(Number(n & 0x7fn) | (shifted > 0n ? 0x80 : 0x00));
        if (shifted === 0n) {
            break;
        }
        n = shifted;
    }
};

/** Read a uvarint. Mirrors `load_uvarint_b`. */
export const readUVarint = (reader: ByteReader): bigint => {
    let result = 0n;
    let shift = 0n;
    for (;;) {
        const byte = reader.readByte();
        result += BigInt(byte & 0x7f) << shift;
        if ((byte & 0x80) === 0) {
            break;
        }
        shift += 7n;
    }

    return result;
};

/** Append `value` as a fixed-width little-endian integer. Mirrors `dump_uint`. */
export const writeUint = (writer: ByteWriter, value: bigint, width: number): void => {
    if (value < 0n) {
        throw new Error('uint cannot be negative');
    }
    let n = value;
    for (let i = 0; i < width; i++) {
        writer.writeByte(Number(n & 0xffn));
        n >>= 8n;
    }
};

/** Read a fixed-width little-endian integer. Mirrors `load_uint`. */
export const readUint = (reader: ByteReader, width: number): bigint => {
    let result = 0n;
    for (let i = 0; i < width; i++) {
        result += BigInt(reader.readByte()) << BigInt(8 * i);
    }

    return result;
};
