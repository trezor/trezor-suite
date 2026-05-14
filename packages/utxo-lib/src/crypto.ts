// upstream: https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/ts_src/crypto.ts
// differences:
// - added blake256 and hash160blake256 methods (decred)

import { blake256 as nobleBlake256 } from '@noble/hashes/blake1.js';
import { hmac } from '@noble/hashes/hmac.js';
import { ripemd160 as nobleRipemd160, sha1 as nobleSha1 } from '@noble/hashes/legacy.js';
import { sha256 as nobleSha256, sha512 } from '@noble/hashes/sha2.js';

// @noble/hashes 2.x validates inputs with `instanceof Uint8Array`. In some test
// environments (suite-native jest) Buffer comes from a polyfill that fails the
// cross-realm instanceof check. Re-wrap as a plain Uint8Array view (no copy).
const asBytes = (buffer: Buffer): Uint8Array =>
    new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);

export function ripemd160(buffer: Buffer): Buffer {
    return Buffer.from(nobleRipemd160(asBytes(buffer)));
}

export function sha1(buffer: Buffer): Buffer {
    return Buffer.from(nobleSha1(asBytes(buffer)));
}

export function sha256(buffer: Buffer): Buffer {
    return Buffer.from(nobleSha256(asBytes(buffer)));
}

export function blake256(buffer: Buffer): Buffer {
    return Buffer.from(nobleBlake256(asBytes(buffer)));
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
    return Buffer.from(hmac(sha512, asBytes(key), asBytes(data)));
}
