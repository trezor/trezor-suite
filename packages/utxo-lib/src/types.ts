// upstream: https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/ts_src/types.ts
// fork: https://github.com/trezor/trezor-utxo-lib/blob/trezor/src/types.js
// differences:
// - Removed unused objects.

import * as typeforce from 'typeforce';

const SATOSHI_MAX = 21 * 1e14;
export function Satoshi(value: number) {
    return typeforce.UInt53(value) && value <= SATOSHI_MAX;
}

export const Buffer256bit = typeforce.BufferN(32);
export const Hash160bit = typeforce.BufferN(20);
export const Hash256bit = typeforce.BufferN(32);
export const {
    Number,
    Array,
    Boolean,
    String,
    Buffer,
    Hex,
    maybe,
    tuple,
    UInt8,
    UInt16,
    UInt32,
    Function,
    BufferN,
    Nil,
    anyOf,
} = typeforce;
