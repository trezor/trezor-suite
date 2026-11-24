import { hmac } from '@noble/hashes/hmac.js';
import { sha512 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';

const wardChildLabel = new TextEncoder().encode('\x00WARD');

/** Derive the WARD child locally so the daemon receives only the WARD owner secret. */
export const deriveWardOwnerSecret = (evoluNode: string): string => {
    const node = hexToBytes(evoluNode);
    if (node.length !== 64) throw new Error('evoluNode must be a 64-byte SLIP-21 node');
    const wardChild = hmac(sha512, node.subarray(0, 32), wardChildLabel);

    return bytesToHex(wardChild.subarray(32));
};
