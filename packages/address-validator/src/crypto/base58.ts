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

export function decode(input: string): number[] {
    if (input.length === 0) return [];

    let bytes: number[] = [0];
    for (let i = 0; i < input.length; ++i) {
        const char = input[i];
        if (!(char in ALPHABET_MAP)) throw new Error('Non-base58 character');

        for (let j = 0; j < bytes.length; ++j) bytes[j] *= BASE;
        bytes[0] += ALPHABET_MAP[char];

        let carry = 0;
        for (let j = 0; j < bytes.length; ++j) {
            bytes[j] += carry;
            carry = bytes[j] >> 8;
            bytes[j] &= 0xff;
        }

        while (carry) {
            bytes.push(carry & 0xff);
            carry >>= 8;
        }
    }
    for (let i = 0; input[i] === '1' && i < input.length - 1; ++i) {
        bytes.push(0);
    }

    return bytes.reverse();
}
