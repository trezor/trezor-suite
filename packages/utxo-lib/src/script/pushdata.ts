// Inlined from pushdata-bitcoin (https://github.com/bitcoinjs/pushdata-bitcoin),
// unmaintained since 2017.
//
// The MIT License (MIT)
//
// Copyright (c) 2016 Daniel Cousens
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import { OPS } from './ops';

export function encodingLength(i: number): number {
    if (i < OPS.OP_PUSHDATA1) return 1;
    if (i <= 0xff) return 2;
    if (i <= 0xffff) return 3;

    return 5;
}

export function encode(buffer: Buffer, number: number, offset: number): number {
    const size = encodingLength(number);

    // ~6 bit
    if (size === 1) {
        buffer.writeUInt8(number, offset);

        // 8 bit
    } else if (size === 2) {
        buffer.writeUInt8(OPS.OP_PUSHDATA1, offset);
        buffer.writeUInt8(number, offset + 1);

        // 16 bit
    } else if (size === 3) {
        buffer.writeUInt8(OPS.OP_PUSHDATA2, offset);
        buffer.writeUInt16LE(number, offset + 1);

        // 32 bit
    } else {
        buffer.writeUInt8(OPS.OP_PUSHDATA4, offset);
        buffer.writeUInt32LE(number, offset + 1);
    }

    return size;
}

export function decode(
    buffer: Buffer,
    offset: number,
): { opcode: number; number: number; size: number } | null {
    const opcode = buffer.readUInt8(offset);
    let number: number;
    let size: number;

    // ~6 bit
    if (opcode < OPS.OP_PUSHDATA1) {
        number = opcode;
        size = 1;

        // 8 bit
    } else if (opcode === OPS.OP_PUSHDATA1) {
        if (offset + 2 > buffer.length) return null;
        number = buffer.readUInt8(offset + 1);
        size = 2;

        // 16 bit
    } else if (opcode === OPS.OP_PUSHDATA2) {
        if (offset + 3 > buffer.length) return null;
        number = buffer.readUInt16LE(offset + 1);
        size = 3;

        // 32 bit
    } else {
        if (offset + 5 > buffer.length) return null;
        if (opcode !== OPS.OP_PUSHDATA4) throw new Error('Unexpected opcode');

        number = buffer.readUInt32LE(offset + 1);
        size = 5;
    }

    return { opcode, number, size };
}
