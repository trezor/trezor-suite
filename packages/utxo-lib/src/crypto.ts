// upstream: https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/ts_src/crypto.ts
// differences:
// - added blake256 and hash160blake256 methods (decred)

import { blake256 as nobleBlake256 } from '@noble/hashes/blake1.js';
import { hmac } from '@noble/hashes/hmac.js';
import { sha512 } from '@noble/hashes/sha2.js';
import { createHash } from 'crypto';

export function ripemd160(buffer: Buffer): Buffer {
    try {
        return createHash('rmd160').update(buffer).digest();
    } catch {
        return createHash('ripemd160').update(buffer).digest();
    }
}

export function sha1(buffer: Buffer): Buffer {
    return createHash('sha1').update(buffer).digest();
}

export function sha256(buffer: Buffer): Buffer {
    return createHash('sha256').update(buffer).digest();
}

export function blake256(buffer: Buffer): Buffer {
    return Buffer.from(nobleBlake256(buffer));
}

export function hash160(buffer: Buffer): Buffer {
    return ripemd160(sha256(buffer));
}

export function hash160blake256(buffer: Buffer): Buffer {
    return ripemd160(blake256(buffer));
}

export function hash256(buffer: Buffer): Buffer {
    return sha256(sha256(buffer));
}

export function hmacSHA512(key: Buffer, data: Buffer): Buffer {
    return Buffer.from(hmac(sha512, key, data));
}
