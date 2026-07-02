// Derive the RingCT commitment mask (amount blinding factor) of an owned output from the wallet's
// private view key. The Trezor firmware does NOT trust this blindly — in step_09_sign_input it
// recomputes the mask from its own keys and checks gen_commitment(mask, amount) against the output's
// on-chain commitment ("Real source entry's mask does not equal spend key's"). So this must reproduce
// Monero's deterministic (HF10+) mask exactly, or the device rejects the transaction.
//
//   D    = generate_key_derivation(R, a) = 8 * (a * R)          // 32-byte encoded point
//   s    = derivation_to_scalar(D, i)    = Hs(D || varint(i))   // i = output's in-tx index
//   mask = genCommitmentMask(s)          = Hs("commitment_mask" || s)
//   Hs(x) = sc_reduce32(keccak256(x))                            // Monero hash_to_scalar
//
// The view key never leaves the local client; this runs host-side inside the send pipeline where the
// source tx (and thus R + in-tx index) has already been resolved.
import { ed25519 } from '@noble/curves/ed25519.js';
import { bytesToNumberLE, numberToBytesLE } from '@noble/curves/utils.js';
import { keccak_256 } from '@noble/hashes/sha3.js';

import { bytesToHex, hexToBytes } from './hex';

const { Point } = ed25519;
const { Fn } = Point; // scalar field over the group order l (= 2^252 + 277...493)

// 15-byte ASCII domain prefix Monero hashes before the scalar in rct::genCommitmentMask.
const COMMITMENT_MASK_PREFIX = new TextEncoder().encode('commitment_mask');

const concatBytes = (...parts: Uint8Array[]): Uint8Array => {
    const total = parts.reduce((sum, part) => sum + part.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const part of parts) {
        out.set(part, offset);
        offset += part.length;
    }

    return out;
};

// Monero hash_to_scalar: keccak256 then reduce the 32-byte little-endian result mod l. Returns the
// reduced scalar as 32 little-endian bytes (the wire/device encoding crypto.decodeint expects).
const hashToScalar = (data: Uint8Array): Uint8Array =>
    numberToBytesLE(Fn.create(bytesToNumberLE(keccak_256(data))), 32);

// Monero varint (unsigned LEB128): 7 bits per byte, high bit set on every byte but the last. Output
// indices are small, but encode the full range correctly all the same.
export const writeVarint = (value: number): Uint8Array => {
    if (!Number.isInteger(value) || value < 0) {
        throw new Error(`commitmentMask: output index ${value} must be a non-negative integer`);
    }
    const out: number[] = [];
    let remaining = value;
    do {
        let byte = remaining & 0x7f;
        remaining = Math.floor(remaining / 128);
        if (remaining > 0) {
            byte |= 0x80;
        }
        out.push(byte);
    } while (remaining > 0);

    return Uint8Array.from(out);
};

// generate_key_derivation(R, a) = encode(8 * (a * R)). Multiplying by the cofactor 8 clears any
// torsion a Monero tx public key may carry, so the result matches the daemon's view exactly.
export const generateKeyDerivation = (txPubKey: string, viewKey: string): Uint8Array => {
    const point = Point.fromHex(txPubKey);
    const scalar = Fn.create(bytesToNumberLE(hexToBytes(viewKey)));

    return point.multiplyUnsafe(scalar).clearCofactor().toBytes();
};

export interface CommitmentMaskParams {
    /** Wallet private view key, 32-byte hex (little-endian scalar). */
    viewKey: string;
    /**
     * Derivation public key for this output, 32-byte hex: the transaction public key (tx_extra tag
     * 0x01) for a main-address output, or the per-output additional public key for a subaddress one.
     */
    txPubKey: string;
    /** The output's index within its source transaction. */
    outputIndex: number;
}

/**
 * The deterministic RingCT commitment mask (blinding factor) of an owned output, hex. Matches the
 * value the Trezor firmware recomputes and verifies against the on-chain commitment when signing.
 */
export const deriveCommitmentMask = ({
    viewKey,
    txPubKey,
    outputIndex,
}: CommitmentMaskParams): string => {
    const derivation = generateKeyDerivation(txPubKey, viewKey);
    const scalar = hashToScalar(concatBytes(derivation, writeVarint(outputIndex)));
    const mask = hashToScalar(concatBytes(COMMITMENT_MASK_PREFIX, scalar));

    return bytesToHex(mask);
};
