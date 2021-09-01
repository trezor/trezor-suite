// upstream: https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/ts_src/crypto.ts
// differences:
// - added blake256 and hash160blake256 methods (decred)

import * as blakeHash from 'blake-hash';
import * as createHash from 'create-hash';

export function ripemd160(buffer: Buffer): Buffer {
    try {
        return createHash('rmd160').update(buffer).digest();
    } catch (err) {
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
    return blakeHash('blake256').update(buffer).digest();
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
