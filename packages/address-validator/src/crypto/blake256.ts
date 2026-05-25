/* eslint-disable @typescript-eslint/no-use-before-define, import/no-default-export */

type Blake256Context = {
    _h: number[];
    _s: number[];
    _block: Buffer;
    _blockOffset: number;
    _length: number[];
    _nullt: boolean;
    _zo: Buffer;
    _oo: Buffer;
};

/**
 * Credits to https://github.com/cryptocoinjs/blake-hash
 */
Blake256.sigma = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    [14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3],
    [11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4],
    [7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8],
    [9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13],
    [2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9],
    [12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11],
    [13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10],
    [6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5],
    [10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0],
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    [14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3],
    [11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4],
    [7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8],
    [9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13],
    [2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9],
];

Blake256.u256 = [
    0x243f6a88, 0x85a308d3, 0x13198a2e, 0x03707344, 0xa4093822, 0x299f31d0, 0x082efa98, 0xec4e6c89,
    0x452821e6, 0x38d01377, 0xbe5466cf, 0x34e90c6c, 0xc0ac29b7, 0xc97c50dd, 0x3f84d5b5, 0xb5470917,
];

Blake256.padding = Buffer.from([
    0x80, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0,
]);

Blake256.prototype._length_carry = function (arr: number[]) {
    for (let j = 0; j < arr.length; ++j) {
        const j1 = j + 1;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const current: number = arr[j];
        if (current < 0x0100000000) break;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const next: number = arr[j1];
        arr[j] = current - 0x0100000000;
        arr[j1] = next + 1;
    }
};

// WTF
Blake256.prototype.update = function (
    this: Blake256Context & { _length_carry(arr: number[]): void; _compress(): void },
    data: any,
    encoding?: BufferEncoding,
) {
    data = Buffer.from(data, encoding);
    const block = this._block;
    let offset = 0;

    while (this._blockOffset + data.length - offset >= block.length) {
        for (let i = this._blockOffset; i < block.length; ) block[i++] = data[offset++];

        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const len0: number = this._length[0];
        this._length[0] = len0 + block.length * 8;
        this._length_carry(this._length);

        this._compress();
        this._blockOffset = 0;
    }

    while (offset < data.length) block[this._blockOffset++] = data[offset++];

    return this;
};

const zo = Buffer.from([0x01]);
const oo = Buffer.from([0x81]);

function rot(x: number, n: number) {
    return ((x << (32 - n)) | (x >>> n)) >>> 0;
}

function g(
    v: number[],
    m: number[],
    i: number,
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
) {
    const { sigma, u256 } = Blake256;
    const e1 = e + 1;
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const sigmaRow: number[] = sigma[i];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const sigmaE: number = sigmaRow[e];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const sigmaEPlus: number = sigmaRow[e1];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const mSE: number = m[sigmaE];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const mSEPlus: number = m[sigmaEPlus];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const uSE: number = u256[sigmaE];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const uSEPlus: number = u256[sigmaEPlus];

    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    let va: number = v[a];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    let vb: number = v[b];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    let vc: number = v[c];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    let vd: number = v[d];

    va = (va + ((mSE ^ uSEPlus) >>> 0) + vb) >>> 0;
    v[a] = va;
    vd = rot(vd ^ va, 16);
    v[d] = vd;
    vc = (vc + vd) >>> 0;
    v[c] = vc;
    vb = rot(vb ^ vc, 12);
    v[b] = vb;
    va = (va + ((mSEPlus ^ uSE) >>> 0) + vb) >>> 0;
    v[a] = va;
    vd = rot(vd ^ va, 8);
    v[d] = vd;
    vc = (vc + vd) >>> 0;
    v[c] = vc;
    vb = rot(vb ^ vc, 7);
    v[b] = vb;
}

function Blake256(this: Blake256Context) {
    this._h = [
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab,
        0x5be0cd19,
    ];

    this._s = [0, 0, 0, 0];

    this._block = Buffer.alloc(64);
    this._blockOffset = 0;
    this._length = [0, 0];

    this._nullt = false;

    this._zo = zo;
    this._oo = oo;
}

Blake256.prototype._compress = function (this: Blake256Context) {
    const { u256 } = Blake256;
    const v = new Array(16);
    const m = new Array(16);
    let i;

    for (i = 0; i < 16; ++i) m[i] = this._block.readUInt32BE(i * 4);
    for (i = 0; i < 8; ++i) {
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const hi: number = this._h[i];
        v[i] = hi >>> 0;
    }
    for (i = 8; i < 12; ++i) {
        const sIndex = i - 8;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const si: number = this._s[sIndex];
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const ui: number = u256[sIndex];
        v[i] = (si ^ ui) >>> 0;
    }
    for (i = 12; i < 16; ++i) {
        const sIndex = i - 8;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const ui: number = u256[sIndex];
        v[i] = ui;
    }

    if (!this._nullt) {
        const v12: number = v[12];
        const v13: number = v[13];
        const v14: number = v[14];
        const v15: number = v[15];
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const len0: number = this._length[0];
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const len1: number = this._length[1];
        v[12] = (v12 ^ len0) >>> 0;
        v[13] = (v13 ^ len0) >>> 0;
        v[14] = (v14 ^ len1) >>> 0;
        v[15] = (v15 ^ len1) >>> 0;
    }

    for (i = 0; i < 14; ++i) {
        /* column step */
        g(v, m, i, 0, 4, 8, 12, 0);
        g(v, m, i, 1, 5, 9, 13, 2);
        g(v, m, i, 2, 6, 10, 14, 4);
        g(v, m, i, 3, 7, 11, 15, 6);
        /* diagonal step */
        g(v, m, i, 0, 5, 10, 15, 8);
        g(v, m, i, 1, 6, 11, 12, 10);
        g(v, m, i, 2, 7, 8, 13, 12);
        g(v, m, i, 3, 4, 9, 14, 14);
    }

    for (i = 0; i < 16; ++i) {
        const hIndex = i % 8;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const hVal: number = this._h[hIndex];
        const vi: number = v[i];
        this._h[hIndex] = (hVal ^ vi) >>> 0;
    }
    for (i = 0; i < 8; ++i) {
        const sIndex = i % 4;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const hVal: number = this._h[i];
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const sVal: number = this._s[sIndex];
        this._h[i] = (hVal ^ sVal) >>> 0;
    }
};

Blake256.prototype._padding = function (this: Blake256Context & { update(data: Buffer): void }) {
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const len0Initial: number = this._length[0];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const len1Initial: number = this._length[1];
    let lo = len0Initial + this._blockOffset * 8;
    let hi = len1Initial;
    if (lo >= 0x0100000000) {
        lo -= 0x0100000000;
        hi += 1;
    }

    const msglen = Buffer.alloc(8);
    msglen.writeUInt32BE(hi, 0);
    msglen.writeUInt32BE(lo, 4);

    if (this._blockOffset === 55) {
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const len0: number = this._length[0];
        this._length[0] = len0 - 8;
        this.update(this._oo);
    } else {
        if (this._blockOffset < 55) {
            if (this._blockOffset === 0) this._nullt = true;
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const len0: number = this._length[0];
            this._length[0] = len0 - (55 - this._blockOffset) * 8;
            this.update(Blake256.padding.slice(0, 55 - this._blockOffset));
        } else {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const len0: number = this._length[0];
            this._length[0] = len0 - (64 - this._blockOffset) * 8;
            this.update(Blake256.padding.slice(0, 64 - this._blockOffset));
            const len0After: number = this._length[0];
            this._length[0] = len0After - 55 * 8;
            this.update(Blake256.padding.slice(1, 1 + 55));
            this._nullt = true;
        }

        this.update(this._zo);
        const len0: number = this._length[0];
        this._length[0] = len0 - 8;
    }

    const len0Final: number = this._length[0];
    this._length[0] = len0Final - 64;
    this.update(msglen);
};

Blake256.prototype.digest = function (
    this: Blake256Context & { _padding(): void },
    encoding?: BufferEncoding,
) {
    this._padding();

    const buffer = Buffer.alloc(32);
    for (let i = 0; i < 8; ++i) {
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const hVal: number = this._h[i];
        buffer.writeUInt32BE(hVal, i * 4);
    }

    return buffer.toString(encoding);
};

export default Blake256;
