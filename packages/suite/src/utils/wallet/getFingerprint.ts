import { sha3_256 } from '@noble/hashes/sha3.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';

export function getFingerprint(data: unknown): string {
    return bytesToHex(
        sha3_256(utf8ToBytes(typeof data === 'string' ? data : JSON.stringify(data))),
    );
}
