// Base58 encoding/decoding
// Originally written by Mike Hearn for BitcoinJ
// Copyright (c) 2011 Google Inc
// Ported to JavaScript by Stefan Thomas
// Merged Buffer refactorings from base58-native by Stephen Pair
// Copyright (c) 2013 BitPay Inc

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const ALPHABET_MAP: Record<string, number> = {};
for (let i = 0; i < ALPHABET.length; ++i) {
    ALPHABET_MAP[ALPHABET.charAt(i)] = i;
}
const BASE = ALPHABET.length;

export const decode = (string: string): number[] => {
    if (string.length === 0) return [];

    const bytes = [0];
    for (let i = 0; i < string.length; ++i) {
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const c: string = string[i];
        if (!(c in ALPHABET_MAP)) throw new Error('Non-base58 character');

        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const charValue: number = ALPHABET_MAP[c];
        for (let j = 0; j < bytes.length; ++j) {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const byteValue: number = bytes[j];
            bytes[j] = byteValue * BASE;
        }
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const firstByte: number = bytes[0];
        bytes[0] = firstByte + charValue;

        let carry = 0;
        for (let j = 0; j < bytes.length; ++j) {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const byteValue: number = bytes[j];
            const updated = byteValue + carry;
            carry = updated >> 8;
            bytes[j] = updated & 0xff;
        }

        while (carry) {
            bytes.push(carry & 0xff);
            carry >>= 8;
        }
    }
    // deal with leading zeros
    for (let i = 0; string[i] === '1' && i < string.length - 1; ++i) {
        bytes.push(0);
    }

    return bytes.reverse();
};
