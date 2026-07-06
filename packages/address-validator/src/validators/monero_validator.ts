import { keccak_256 } from '@noble/hashes/sha3.js';

import type { AddressValidator } from '../AddressValidator';
import { addressType } from '../addressType';
import type { NetworkSymbol } from '../networkTypes';

// Monero "CryptoNote" Base58 — block-based (NOT the Bitcoin variant). Data is processed in 8-byte
// blocks; a decoded block of N bytes maps to ENCODED_BLOCK_SIZES[N] encoded chars. This mirrors
// @trezor/connect's Monero address parser; address-validator cannot depend on connect, so the
// decoder is duplicated here (kept small: only decoding + checksum is needed for validation).
const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BASE = 58n;
const FULL_BLOCK_SIZE = 8;
const FULL_ENCODED_BLOCK_SIZE = 11;
const ENCODED_BLOCK_SIZES = [0, 2, 3, 5, 6, 7, 9, 10, 11];

const ALPHABET_MAP: Record<string, number> = {};
for (let i = 0; i < ALPHABET.length; i++) {
    ALPHABET_MAP[ALPHABET[i]!] = i;
}

const numToUint8be = (value: bigint, size: number): Uint8Array => {
    const result = new Uint8Array(size);
    let n = value;
    for (let i = size - 1; i >= 0; i--) {
        result[i] = Number(n & 0xffn);
        n >>= 8n;
    }

    return result;
};

const decodeBlock = (block: string, out: Uint8Array, index: number): void => {
    const resSize = ENCODED_BLOCK_SIZES.indexOf(block.length);
    if (resSize <= 0) {
        throw new Error('base58: invalid encoded block size');
    }
    let resNum = 0n;
    let order = 1n;
    for (let i = block.length - 1; i >= 0; i--) {
        const digit = ALPHABET_MAP[block[i]!];
        if (digit === undefined) {
            throw new Error('base58: invalid symbol');
        }
        resNum += order * BigInt(digit);
        order *= BASE;
    }
    if (resSize < FULL_BLOCK_SIZE && 1n << BigInt(8 * resSize) <= resNum) {
        throw new Error('base58: block overflow');
    }
    if (resSize === FULL_BLOCK_SIZE && resNum > 0xffffffffffffffffn) {
        throw new Error('base58: block overflow');
    }
    out.set(numToUint8be(resNum, resSize), index);
};

const base58Decode = (encoded: string): Uint8Array => {
    const fullBlocks = Math.floor(encoded.length / FULL_ENCODED_BLOCK_SIZE);
    const lastBlockSize = encoded.length % FULL_ENCODED_BLOCK_SIZE;
    const lastDecodedSize = ENCODED_BLOCK_SIZES.indexOf(lastBlockSize);
    if (lastDecodedSize < 0) {
        throw new Error('base58: invalid encoded length');
    }

    const out = new Uint8Array(fullBlocks * FULL_BLOCK_SIZE + lastDecodedSize);
    for (let i = 0; i < fullBlocks; i++) {
        decodeBlock(
            encoded.slice(i * FULL_ENCODED_BLOCK_SIZE, (i + 1) * FULL_ENCODED_BLOCK_SIZE),
            out,
            i * FULL_BLOCK_SIZE,
        );
    }
    if (lastBlockSize > 0) {
        decodeBlock(
            encoded.slice(fullBlocks * FULL_ENCODED_BLOCK_SIZE),
            out,
            fullBlocks * FULL_BLOCK_SIZE,
        );
    }

    return out;
};

// A Monero address decodes to <tag><32-byte spend key><32-byte view key>[<8-byte payment id,
// integrated only>]<4-byte checksum>, where checksum = keccak-256(everything before it)[:4].
const STANDARD_LEN = 69;
const INTEGRATED_LEN = 77;
// Mainnet tags: 18 standard, 19 integrated, 42 subaddress (Suite supports Monero mainnet only).
const STANDARD_TAG = 18;
const INTEGRATED_TAG = 19;
const SUBADDRESS_TAG = 42;

const bytesEqual = (a: Uint8Array, b: Uint8Array): boolean => {
    if (a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }

    return true;
};

export const isAddressValid = (address: string, _symbol: NetworkSymbol): boolean => {
    let data: Uint8Array;
    try {
        data = base58Decode(address);
    } catch {
        return false;
    }

    const tag = data[0];
    const isStandard =
        data.length === STANDARD_LEN && (tag === STANDARD_TAG || tag === SUBADDRESS_TAG);
    const isIntegrated = data.length === INTEGRATED_LEN && tag === INTEGRATED_TAG;
    if (!isStandard && !isIntegrated) {
        return false;
    }

    const checksum = data.subarray(data.length - 4);
    const computed = keccak_256(data.subarray(0, data.length - 4)).subarray(0, 4);

    return bytesEqual(checksum, computed);
};

export const getAddressType = (address: string, symbol: NetworkSymbol) => {
    if (isAddressValid(address, symbol)) {
        return addressType.ADDRESS;
    }

    return undefined;
};

const getSupportedCoins = (): NetworkSymbol[] => ['xmr'];

export const moneroValidator: AddressValidator = {
    isAddressValid,
    getAddressType,
    getSupportedCoins,
};
