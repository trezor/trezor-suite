// Monero address parsing.
//
// A Monero address is Base58 of: <network tag><32-byte spend pubkey><32-byte view pubkey>
// [<8-byte payment id, integrated only>]<4-byte checksum>, where the checksum is the first 4 bytes
// of keccak-256 over everything that precedes it (Monero uses the original Keccak, which
// @noble/hashes' keccak_256 implements).
import { keccak_256 } from '@noble/hashes/sha3.js';

import { base58Decode } from './base58';

export interface MoneroAddress {
    /** Network/type tag, e.g. mainnet standard 18, integrated 19, subaddress 42. */
    tag: number;
    spendPublicKey: Uint8Array; // 32 bytes
    viewPublicKey: Uint8Array; // 32 bytes
    paymentId?: Uint8Array; // 8 bytes, integrated addresses only
    isSubaddress: boolean;
}

const STANDARD_LEN = 69;
const INTEGRATED_LEN = 77;

// Mainnet network/type tags. The connect send path is mainnet-only (moneroSignTransaction hardcodes
// MoneroNetworkType.MAINNET), so a stagenet/testnet address — which still passes the checksum — must
// be rejected rather than silently forwarded to the device.
const MAINNET_STANDARD_TAG = 18;
const MAINNET_INTEGRATED_TAG = 19;
const MAINNET_SUBADDRESS_TAG = 42;
const MAINNET_TAGS = new Set([
    MAINNET_STANDARD_TAG,
    MAINNET_INTEGRATED_TAG,
    MAINNET_SUBADDRESS_TAG,
]);

const bytesEqual = (a: Uint8Array, b: Uint8Array): boolean => {
    if (a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }

    return true;
};

export const parseMoneroAddress = (address: string): MoneroAddress => {
    const data = base58Decode(address);
    if (data.length !== STANDARD_LEN && data.length !== INTEGRATED_LEN) {
        throw new Error(`Invalid Monero address length ${data.length}`);
    }

    const checksum = data.subarray(data.length - 4);
    const computed = keccak_256(data.subarray(0, data.length - 4)).subarray(0, 4);
    if (!bytesEqual(checksum, computed)) {
        throw new Error('Invalid Monero address checksum');
    }

    // Network/type tag is a varint; every standard Monero tag fits in a single byte (< 128).
    const tag = data[0]!;
    if (!MAINNET_TAGS.has(tag)) {
        throw new Error(`Unsupported Monero address network tag ${tag} (mainnet only)`);
    }

    return {
        tag,
        spendPublicKey: data.subarray(1, 33),
        viewPublicKey: data.subarray(33, 65),
        paymentId: data.length === INTEGRATED_LEN ? data.subarray(65, 73) : undefined,
        isSubaddress: tag === MAINNET_SUBADDRESS_TAG,
    };
};
