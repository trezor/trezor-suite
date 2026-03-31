import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';

// Tron protocol constant: 1000 SUN per byte, charged when available bandwidth is insufficient
export const TRON_BANDWIDTH_SUN_PRICE = 1000;

// Tron base58check address → 21-byte raw address (includes 0x41 network prefix).
export const tronAddressToBytes = (address: string): Uint8Array | null => {
    const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    if (address.length !== 34 || !address.startsWith('T')) return null;
    let num = 0n;
    for (const char of address) {
        const idx = BASE58.indexOf(char);
        if (idx < 0) return null;
        num = num * 58n + BigInt(idx);
    }
    const full = hexToBytes(num.toString(16).padStart(50, '0'));
    const payload = full.slice(0, 21);
    const checksum = full.slice(21);
    const expected = sha256(sha256(payload)).slice(0, 4);
    if (!checksum.every((b, i) => b === expected[i])) return null;

    return payload;
};

export const tronAddressToHex = (address: string): string | null => {
    const bytes = tronAddressToBytes(address);

    return bytes ? bytesToHex(bytes) : null;
};
