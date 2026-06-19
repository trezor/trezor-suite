import { sha256 as nobleSha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';

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
