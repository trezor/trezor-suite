import { sha256 as nobleSha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';

import Blake256 from './blake256';
import Blake2B from './blake2b';
import sha3 from './sha3';

// @ts-expect-error: indexing with noUncheckedIndexedAccess
const keccak256Fn: (data: string | Buffer | Uint8Array) => string = (
    sha3 as unknown as Record<string, (data: string | Buffer | Uint8Array) => string>
)['keccak256'];

export function numberToHex(number: number, sizeInBytes: number): string {
    return Math.round(number)
        .toString(16)
        .padStart(sizeInBytes * 2, '0');
}

export function toHex(arrayOfBytes: ArrayLike<number>): string {
    let hex = '';
    for (let i = 0; i < arrayOfBytes.length; i++) {
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const byte: number = arrayOfBytes[i];
        hex += numberToHex(byte, 1);
    }

    return hex;
}

export function sha256(hexPayload: string): string {
    return bytesToHex(nobleSha256(hexToBytes(hexPayload)));
}

export function sha256Checksum(hexPayload: string): string {
    return sha256(sha256(hexPayload)).slice(0, 8);
}

export function blake256(hexString: string): string {
    return new (Blake256 as any)().update(hexString, 'hex').digest('hex');
}

export function blake256Checksum(payload: string): string {
    return blake256(blake256(payload)).slice(0, 8);
}

export function blake2b256(hexString: string): string {
    return new (Blake2B as any)(32).update(Buffer.from(hexString, 'hex'), 32).digest('hex');
}

export function keccak256Checksum(payload: string | Buffer | Uint8Array): string {
    return keccak256Fn(payload).toString().slice(0, 8);
}
