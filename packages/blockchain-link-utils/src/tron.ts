import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';

// Tron protocol constant: 1000 SUN per byte, charged when available bandwidth is insufficient
export const TRON_BANDWIDTH_SUN_PRICE = 1000;

// Tron base58check address → 21-byte raw address (includes 0x41 network prefix)
export const tronAddressToBytes = (address: string): Uint8Array => {
    const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let num = 0n;
    for (const char of address) {
        num = num * 58n + BigInt(BASE58.indexOf(char));
    }
    const hex = num.toString(16).padStart(50, '0').slice(0, 42);

    return hexToBytes(hex);
};

export const tronAddressToHex = (address: string): string =>
    bytesToHex(tronAddressToBytes(address));
