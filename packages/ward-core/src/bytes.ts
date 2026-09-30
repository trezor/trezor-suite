import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';

/** Bytes as the wire JSON carries them (hex), or already decoded. */
export type BytesLike = Uint8Array | string;

export const toBytes = (value: BytesLike | null | undefined): Uint8Array => {
    if (value == null) return new Uint8Array(0);

    return typeof value === 'string' ? hexToBytes(value) : value;
};

export const toHex = (value: Uint8Array): string => bytesToHex(value);

export const concatBytes = (...parts: Uint8Array[]): Uint8Array => {
    const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
    let offset = 0;
    for (const part of parts) {
        out.set(part, offset);
        offset += part.length;
    }

    return out;
};

export const equalBytes = (a: Uint8Array | null, b: Uint8Array | null): boolean => {
    if (a === null || b === null) return a === b;
    if (a.length !== b.length) return false;

    return a.every((byte, i) => byte === b[i]);
};

export const u16 = (n: number): Uint8Array => Uint8Array.of((n >> 8) & 0xff, n & 0xff);

export const u32 = (n: number): Uint8Array =>
    Uint8Array.of((n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff);
