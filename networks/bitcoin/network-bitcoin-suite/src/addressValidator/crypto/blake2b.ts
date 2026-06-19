/* eslint-disable @typescript-eslint/no-use-before-define, import/no-default-export */

type Blake2bContext = {
    b: Uint8Array;
    h: Uint32Array;
    t: number;
    c: number;
    outlen: number;
};

type Blake2bDigestOutput = Uint8Array | string;
type Blake2bOutputEncoding = 'binary' | 'hex';

/**
 * Credits to https://github.com/emilbayes/blake2b
 *
 * Copyright (c) 2017, Emil Bay github@tixz.dk
 *
 * Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

// 64-bit unsigned addition
// Sets v[a,a+1] += v[b,b+1]
// v should be a Uint32Array
function ADD64AA(v: Uint32Array, a: number, b: number) {
    const a1 = a + 1;
    const b1 = b + 1;
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const va: number = v[a];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const vb: number = v[b];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const vaPlus: number = v[a1];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const vbPlus: number = v[b1];
    const o0 = va + vb;
    let o1 = vaPlus + vbPlus;
    if (o0 >= 0x100000000) {
        o1++;
    }
    v[a] = o0;
    v[a1] = o1;
}

// 64-bit unsigned addition
// Sets v[a,a+1] += b
// b0 is the low 32 bits of b, b1 represents the high 32 bits
function ADD64AC(v: Uint32Array, a: number, b0: number, b1: number) {
    const a1 = a + 1;
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const va: number = v[a];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const vaPlus: number = v[a1];
    let o0 = va + b0;
    if (b0 < 0) {
        o0 += 0x100000000;
    }
    let o1 = vaPlus + b1;
    if (o0 >= 0x100000000) {
        o1++;
    }
    v[a] = o0;
    v[a1] = o1;
}

// Little-endian byte access
function B2B_GET32(arr: Uint8Array, i: number) {
    const i1 = i + 1;
    const i2 = i + 2;
    const i3 = i + 3;
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const a0: number = arr[i];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const a1: number = arr[i1];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const a2: number = arr[i2];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const a3: number = arr[i3];

    return a0 ^ (a1 << 8) ^ (a2 << 16) ^ (a3 << 24);
}

// G Mixing function
// The ROTRs are inlined for speed
function B2B_G(a: number, b: number, c: number, d: number, ix: number, iy: number) {
    const a1 = a + 1;
    const b1 = b + 1;
    const c1 = c + 1;
    const d1 = d + 1;
    const ix1 = ix + 1;
    const iy1 = iy + 1;
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const x0: number = m[ix];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const x1: number = m[ix1];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const y0: number = m[iy];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const y1: number = m[iy1];

    ADD64AA(v, a, b); // v[a,a+1] += v[b,b+1] ... in JS we must store a uint64 as two uint32s
    ADD64AC(v, a, x0, x1); // v[a, a+1] += x ... x0 is the low 32 bits of x, x1 is the high 32 bits

    // v[d,d+1] = (v[d,d+1] xor v[a,a+1]) rotated to the right by 32 bits
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const vd1: number = v[d];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const va1: number = v[a];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const vd1plus: number = v[d1];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const va1plus: number = v[a1];
    let xor0 = vd1 ^ va1;
    let xor1 = vd1plus ^ va1plus;
    v[d] = xor1;
    v[d1] = xor0;

    ADD64AA(v, c, d);

    // v[b,b+1] = (v[b,b+1] xor v[c,c+1]) rotated right by 24 bits
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const vb2: number = v[b];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const vc2: number = v[c];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const vb2plus: number = v[b1];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const vc2plus: number = v[c1];
    xor0 = vb2 ^ vc2;
    xor1 = vb2plus ^ vc2plus;
    v[b] = (xor0 >>> 24) ^ (xor1 << 8);
    v[b1] = (xor1 >>> 24) ^ (xor0 << 8);

    ADD64AA(v, a, b);
    ADD64AC(v, a, y0, y1);

    // v[d,d+1] = (v[d,d+1] xor v[a,a+1]) rotated right by 16 bits
    const vd3: number = v[d];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const va3: number = v[a];
    const vd3plus: number = v[d1];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const va3plus: number = v[a1];
    xor0 = vd3 ^ va3;
    xor1 = vd3plus ^ va3plus;
    v[d] = (xor0 >>> 16) ^ (xor1 << 16);
    v[d1] = (xor1 >>> 16) ^ (xor0 << 16);

    ADD64AA(v, c, d);

    // v[b,b+1] = (v[b,b+1] xor v[c,c+1]) rotated right by 63 bits
    const vb4: number = v[b];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const vc4: number = v[c];
    const vb4plus: number = v[b1];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const vc4plus: number = v[c1];
    xor0 = vb4 ^ vc4;
    xor1 = vb4plus ^ vc4plus;
    v[b] = (xor1 >>> 31) ^ (xor0 << 1);
    v[b1] = (xor0 >>> 31) ^ (xor1 << 1);
}

// Initialization Vector
const BLAKE2B_IV32 = new Uint32Array([
    0xf3bcc908, 0x6a09e667, 0x84caa73b, 0xbb67ae85, 0xfe94f82b, 0x3c6ef372, 0x5f1d36f1, 0xa54ff53a,
    0xade682d1, 0x510e527f, 0x2b3e6c1f, 0x9b05688c, 0xfb41bd6b, 0x1f83d9ab, 0x137e2179, 0x5be0cd19,
]);

const SIGMA8 = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2,
    11, 7, 5, 3, 11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4, 7, 9, 3, 1, 13, 12, 11, 14,
    2, 6, 5, 10, 4, 0, 15, 8, 9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13, 2, 12, 6, 10, 0,
    11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9, 12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11, 13,
    11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10, 6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4,
    10, 5, 10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    11, 12, 13, 14, 15, 14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3,
] as const;

// These are offsets into a uint64 buffer.
// Multiply them all by 2 to make them offsets into a uint32 buffer,
// because this is Javascript and we don't have uint64s
const SIGMA82 = new Uint8Array(
    SIGMA8.map(function (x) {
        return x * 2;
    }),
);

// Compression function. 'last' flag indicates last block.
// Note we're representing 16 uint64s as 32 uint32s
const v = new Uint32Array(32);
const m = new Uint32Array(32);

function blake2bCompress(ctx: Blake2bContext, last: boolean) {
    let i = 0;

    // init work variables
    for (i = 0; i < 16; i++) {
        const i16 = i + 16;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const ctxH: number = ctx.h[i];
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const iv: number = BLAKE2B_IV32[i];
        v[i] = ctxH;
        v[i16] = iv;
    }

    // low 64 bits of offset
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const v24: number = v[24];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const v25: number = v[25];
    v[24] = v24 ^ ctx.t;
    v[25] = v25 ^ (ctx.t / 0x100000000);
    // high 64 bits not supported, offset may not be higher than 2**53-1

    // last block flag set ?
    if (last) {
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const v28: number = v[28];
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const v29: number = v[29];
        v[28] = ~v28;
        v[29] = ~v29;
    }

    // get little-endian words
    for (i = 0; i < 32; i++) {
        m[i] = B2B_GET32(ctx.b, 4 * i);
    }

    // twelve rounds of mixing
    for (i = 0; i < 12; i++) {
        const base = i * 16;
        const idx1 = base + 1;
        const idx2 = base + 2;
        const idx3 = base + 3;
        const idx4 = base + 4;
        const idx5 = base + 5;
        const idx6 = base + 6;
        const idx7 = base + 7;
        const idx8 = base + 8;
        const idx9 = base + 9;
        const idx10 = base + 10;
        const idx11 = base + 11;
        const idx12 = base + 12;
        const idx13 = base + 13;
        const idx14 = base + 14;
        const idx15 = base + 15;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const s0: number = SIGMA82[base];
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const s1: number = SIGMA82[idx1];
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const s2: number = SIGMA82[idx2];
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const s3: number = SIGMA82[idx3];
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const s4: number = SIGMA82[idx4];
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const s5: number = SIGMA82[idx5];
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const s6: number = SIGMA82[idx6];
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const s7: number = SIGMA82[idx7];
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const s8: number = SIGMA82[idx8];
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const s9: number = SIGMA82[idx9];
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const s10: number = SIGMA82[idx10];
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const s11: number = SIGMA82[idx11];
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const s12: number = SIGMA82[idx12];
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const s13: number = SIGMA82[idx13];
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const s14: number = SIGMA82[idx14];
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const s15: number = SIGMA82[idx15];
        B2B_G(0, 8, 16, 24, s0, s1);
        B2B_G(2, 10, 18, 26, s2, s3);
        B2B_G(4, 12, 20, 28, s4, s5);
        B2B_G(6, 14, 22, 30, s6, s7);
        B2B_G(0, 10, 20, 30, s8, s9);
        B2B_G(2, 12, 22, 24, s10, s11);
        B2B_G(4, 14, 16, 26, s12, s13);
        B2B_G(6, 8, 18, 28, s14, s15);
    }

    for (i = 0; i < 16; i++) {
        const i16 = i + 16;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const ctxH: number = ctx.h[i];
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const vi: number = v[i];
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const vi16: number = v[i16];
        ctx.h[i] = ctxH ^ vi ^ vi16;
    }
}

// reusable parameter_block
const parameter_block = new Uint8Array([
    0,
    0,
    0,
    0, //  0: outlen, keylen, fanout, depth
    0,
    0,
    0,
    0, //  4: leaf length, sequential mode
    0,
    0,
    0,
    0, //  8: node offset
    0,
    0,
    0,
    0, // 12: node offset
    0,
    0,
    0,
    0, // 16: node depth, inner length, rfu
    0,
    0,
    0,
    0, // 20: rfu
    0,
    0,
    0,
    0, // 24: rfu
    0,
    0,
    0,
    0, // 28: rfu
    0,
    0,
    0,
    0, // 32: salt
    0,
    0,
    0,
    0, // 36: salt
    0,
    0,
    0,
    0, // 40: salt
    0,
    0,
    0,
    0, // 44: salt
    0,
    0,
    0,
    0, // 48: personal
    0,
    0,
    0,
    0, // 52: personal
    0,
    0,
    0,
    0, // 56: personal
    0,
    0,
    0,
    0, // 60: personal
]);

// Creates a BLAKE2b hashing context
// Requires an output length between 1 and 64 bytes
// Takes an optional Uint8Array key
function Blake2b(
    this: Blake2bContext,
    outlen: number,
    key?: Uint8Array,
    salt?: Uint8Array,
    personal?: Uint8Array,
) {
    // zero out parameter_block before usage
    parameter_block.fill(0);
    // state, 'param block'

    this.b = new Uint8Array(128);
    this.h = new Uint32Array(16);
    this.t = 0; // input count
    this.c = 0; // pointer within buffer
    this.outlen = outlen; // output length in bytes

    parameter_block[0] = outlen;
    if (key) parameter_block[1] = key.length;
    parameter_block[2] = 1; // fanout
    parameter_block[3] = 1; // depth

    if (salt) parameter_block.set(salt, 32);
    if (personal) parameter_block.set(personal, 48);

    // initialize hash state
    for (let i = 0; i < 16; i++) {
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const iv: number = BLAKE2B_IV32[i];
        this.h[i] = iv ^ B2B_GET32(parameter_block, i * 4);
    }

    // key the hash, if applicable
    if (key) {
        blake2bUpdate(this, key);
        // at the end
        this.c = 128;
    }
}

Blake2b.prototype.update = function (this: Blake2bContext, input: Uint8Array) {
    blake2bUpdate(this, input);

    return this;
};

Blake2b.prototype.digest = function (
    this: Blake2bContext,
    out?: Uint8Array | Blake2bOutputEncoding,
): Blake2bDigestOutput {
    const buf = !out || out === 'binary' || out === 'hex' ? new Uint8Array(this.outlen) : out;
    blake2bFinal(this, buf);
    if (out === 'hex') return hexSlice(buf);

    return buf;
};

Blake2b.prototype.final = Blake2b.prototype.digest;

// Updates a BLAKE2b streaming hash
// Requires hash context and Uint8Array (byte array)
function blake2bUpdate(ctx: Blake2bContext, input: Uint8Array) {
    for (let i = 0; i < input.length; i++) {
        if (ctx.c === 128) {
            // buffer full ?
            ctx.t += ctx.c; // add counters
            blake2bCompress(ctx, false); // compress (not last)
            ctx.c = 0; // counter to zero
        }
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const inputByte: number = input[i];
        ctx.b[ctx.c++] = inputByte;
    }
}

// Completes a BLAKE2b streaming hash
// Returns a Uint8Array containing the message digest
function blake2bFinal(ctx: Blake2bContext, out: Uint8Array) {
    ctx.t += ctx.c; // mark last block offset

    while (ctx.c < 128) {
        // fill up with zeros
        ctx.b[ctx.c++] = 0;
    }
    blake2bCompress(ctx, true); // final block flag = 1

    for (let i = 0; i < ctx.outlen; i++) {
        const hIndex = i >> 2;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const hVal: number = ctx.h[hIndex];
        out[i] = hVal >> (8 * (i & 3));
    }

    return out;
}

function hexSlice(buf: Uint8Array) {
    let str = '';
    for (let i = 0; i < buf.length; i++) {
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const byte: number = buf[i];
        str += toHex(byte);
    }

    return str;
}

function toHex(n: number) {
    if (n < 16) return '0' + n.toString(16);

    return n.toString(16);
}

export default Blake2b;
