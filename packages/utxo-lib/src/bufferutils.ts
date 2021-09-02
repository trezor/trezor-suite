// upstream: https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/ts_src/bufferutils.ts
// fork: https://github.com/trezor/trezor-utxo-lib/blob/trezor/src/bufferutils.js
// differences:
// - added `BufferReader` "readInt64", "readUInt16" and "readUInt64String" methods.
// - added `BufferWritter` "writeInt64", "writeUInt16" methods.
// - `BufferWritter.writeUInt64` is accepting string or number.

// eslint-disable-next-line max-classes-per-file
import * as BN from 'bn.js';
import * as pushdata from 'pushdata-bitcoin';
import * as varuint from 'varuint-bitcoin';
import { Int64LE } from 'int64-buffer';
import * as typeforce from 'typeforce';
import * as types from './types';

export function verifuint(value: number, max: number) {
    if (typeof value !== 'number') throw new Error('cannot write a non-number as a number');
    if (value < 0) throw new Error('specified a negative value for writing an unsigned value');
    if (value > max) throw new Error('value out of range');
    if (Math.floor(value) !== value) throw new Error('value has a fractional component');
}

export function readUInt64LE(buffer: Buffer, offset: number) {
    const a = buffer.readUInt32LE(offset);
    let b = buffer.readUInt32LE(offset + 4);
    b *= 0x100000000;

    verifuint(b + a, 0x001fffffffffffff);

    return b + a;
}

export function readUInt64LEasString(buffer: Buffer, offset: number) {
    try {
        const result = readUInt64LE(buffer, offset);
        return result.toString();
    } catch (error) {
        const aUint = buffer.readUInt32LE(offset);
        const bUint = buffer.readUInt32LE(offset + 4);
        const m = new BN(0x100000000);
        const a = new BN(aUint);
        const b = new BN(bUint).mul(m);

        return a.add(b).toString();
    }
}

export function readInt64LE(buffer: Buffer, offset: number) {
    const a = buffer.readUInt32LE(offset);
    let b = buffer.readInt32LE(offset + 4);
    b *= 0x100000000;

    return b + a;
}

export function writeUInt64LE(buffer: Buffer, value: number, offset: number) {
    verifuint(value, 0x001fffffffffffff);
    buffer.writeInt32LE(value & -1, offset);
    buffer.writeUInt32LE(Math.floor(value / 0x100000000), offset + 4);
    return offset + 8;
}

export function writeUInt64LEasString(buffer: Buffer, value: string | number, offset: number) {
    if (typeof value !== 'string') {
        return writeUInt64LE(buffer, value, offset);
    }
    const v = new Int64LE(value);
    v.toBuffer().copy(buffer, offset);
    return offset + 8;
}

export function writeInt64LE(buffer: Buffer, value: number, offset: number) {
    const v = new Int64LE(value);
    const a = v.toArray();
    for (let i = 0; i < 8; i++) {
        buffer.writeUInt8(a[i], offset + i);
    }
    return offset + 8;
}

export function readVarInt(buffer: Buffer, offset: number) {
    const result = varuint.decode(buffer, offset);

    return {
        number: result,
        size: varuint.decode.bytes,
    };
}

export function writeVarInt(buffer: Buffer, number: number, offset: number) {
    varuint.encode(number, buffer, offset);
    return varuint.encode.bytes;
}

export function reverseBuffer(src: Buffer): Buffer {
    if (src.length < 1) return src;
    const buffer = Buffer.alloc(src.length);
    let j = buffer.length - 1;
    for (let i = 0; i < buffer.length / 2; i++) {
        buffer[i] = src[j];
        buffer[j] = src[i];
        j--;
    }
    return buffer;
}

export function cloneBuffer(buffer: Buffer): Buffer {
    const clone = Buffer.allocUnsafe(buffer.length);
    buffer.copy(clone);
    return clone;
}

export const pushDataSize = pushdata.encodingLength;
export const readPushDataInt = pushdata.decode;
// export const varIntBuffer = varuint.encode; // TODO: not-used
export const varIntSize = varuint.encodingLength;
export const writePushDataInt = pushdata.encode;

/**
 * Helper class for serialization of bitcoin data types into a pre-allocated buffer.
 */
export class BufferWriter {
    constructor(public buffer: Buffer, public offset: number = 0) {
        typeforce(types.tuple(types.Buffer, types.UInt32), [buffer, offset]);
    }

    writeUInt8(i: number): void {
        this.offset = this.buffer.writeUInt8(i, this.offset);
    }

    writeUInt16(i: number) {
        this.offset = this.buffer.writeUInt16LE(i, this.offset);
    }

    writeInt32(i: number): void {
        this.offset = this.buffer.writeInt32LE(i, this.offset);
    }

    writeUInt32(i: number): void {
        this.offset = this.buffer.writeUInt32LE(i, this.offset);
    }

    writeInt64(i: number) {
        this.offset = writeInt64LE(this.buffer, i, this.offset);
    }

    writeUInt64(i: number | string): void {
        this.offset =
            typeof i === 'string'
                ? writeUInt64LEasString(this.buffer, i, this.offset)
                : writeUInt64LE(this.buffer, i, this.offset);
    }

    writeVarInt(i: number): void {
        varuint.encode(i, this.buffer, this.offset);
        this.offset += varuint.encode.bytes;
    }

    writeSlice(slice: Buffer): void {
        if (this.buffer.length < this.offset + slice.length) {
            throw new Error('Cannot write slice out of bounds');
        }
        this.offset += slice.copy(this.buffer, this.offset);
    }

    writeVarSlice(slice: Buffer): void {
        this.writeVarInt(slice.length);
        this.writeSlice(slice);
    }

    writeVector(vector: Buffer[]): void {
        this.writeVarInt(vector.length);
        vector.forEach((buf: Buffer) => this.writeVarSlice(buf));
    }
}

/**
 * Helper class for reading of bitcoin data types from a buffer.
 */
export class BufferReader {
    constructor(public buffer: Buffer, public offset: number = 0) {
        typeforce(types.tuple(types.Buffer, types.UInt32), [buffer, offset]);
    }

    readUInt8(): number {
        const result = this.buffer.readUInt8(this.offset);
        this.offset++;
        return result;
    }

    readUInt16(): number {
        const result = this.buffer.readUInt16LE(this.offset);
        this.offset += 2;
        return result;
    }

    readInt32(): number {
        const result = this.buffer.readInt32LE(this.offset);
        this.offset += 4;
        return result;
    }

    readUInt32(): number {
        const result = this.buffer.readUInt32LE(this.offset);
        this.offset += 4;
        return result;
    }

    readInt64(): number {
        const result = readInt64LE(this.buffer, this.offset);
        this.offset += 8;
        return result;
    }

    readUInt64() {
        const result = readUInt64LE(this.buffer, this.offset);
        this.offset += 8;
        return result;
    }

    readUInt64String() {
        const result = readUInt64LEasString(this.buffer, this.offset);
        this.offset += 8;
        return result;
    }

    readVarInt(): number {
        const vi = varuint.decode(this.buffer, this.offset);
        this.offset += varuint.decode.bytes;
        return vi;
    }

    readSlice(n: number): Buffer {
        if (this.buffer.length < this.offset + n) {
            throw new Error('Cannot read slice out of bounds');
        }
        const result = this.buffer.slice(this.offset, this.offset + n);
        this.offset += n;
        return result;
    }

    readVarSlice(): Buffer {
        return this.readSlice(this.readVarInt());
    }

    readVector(): Buffer[] {
        const count = this.readVarInt();
        const vector: Buffer[] = [];
        for (let i = 0; i < count; i++) vector.push(this.readVarSlice());
        return vector;
    }
}
