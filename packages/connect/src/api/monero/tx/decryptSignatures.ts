// Decrypt the per-input CLSAG signatures the device returns from moneroSignTransaction.
//
// The Trezor firmware does NOT return the raw CLSAG signature from each SignInput step: it encrypts
// the serialized signature (the `s` scalars || c1 || D) with ChaCha20-Poly1305 under a key derived
// from a per-transaction random `opening_key` (firmware step_09_sign_input._protect_signature). The
// `opening_key` is only revealed at the very end, in the FinalAck. So the host must collect the
// encrypted signatures, then — once the device commits by sending opening_key — decrypt each one
// before assembling the transaction. Skipping this leaves ciphertext in the tx (off-curve D,
// unreduced scalars) and monerod rejects it as "invalid_input".
//
// The key derivation mirrors the firmware exactly (offloading_keys._build_key + key_signature):
//   buf  = opening_key(32) || discriminator(zero-padded to 12) || varint(index)(zero-padded to 4)
//   key  = keccak256(keccak256(buf))            with discriminator "sig-key"
//   iv   = keccak256(keccak256(buf))[:12]        with discriminator "sig-iv"
// where `index` is the input's position in SIGNING order (0-based; the firmware's current_input_index,
// which counts SignInput calls — not the pre-sort orig_idx).
import { chacha20poly1305 } from '@noble/ciphers/chacha.js';
import { keccak_256 } from '@noble/hashes/sha3.js';

import { bytesToHex, hexToBytes } from './hex';

const SECRET_LENGTH = 32;
const DISCRIMINATOR_LENGTH = 12;
const INDEX_LENGTH = 4;
const KEY_BUFFER_LENGTH = SECRET_LENGTH + DISCRIMINATOR_LENGTH + INDEX_LENGTH; // 48
const IV_LENGTH = 12;

const encoder = new TextEncoder();

// The decrypted plaintext is the firmware's mg_buffer: varint(ring_size) || s_0..s_n || c1 || D. The
// wire CLSAG omits that leading ring-size count (the ring size is implied), so drop the varint before
// the bytes are parsed as a wire signature.
const stripLeadingVarint = (bytes: Uint8Array): Uint8Array => {
    let offset = 0;
    while (offset < bytes.length && (bytes[offset]! & 0x80) !== 0) {
        offset += 1;
    }

    return bytes.slice(offset + 1);
};

// keccak_2hash: keccak256 applied twice (firmware crypto_helpers.keccak_2hash).
const keccak2 = (data: Uint8Array): Uint8Array => keccak_256(keccak_256(data));

// firmware offloading_keys._build_key: a fixed 48-byte buffer = secret || discriminator(padded) ||
// varint(index)(in the trailing 4 bytes), double-keccak'd.
const buildKey = (openingKey: Uint8Array, discriminator: string, index: number): Uint8Array => {
    const buf = new Uint8Array(KEY_BUFFER_LENGTH);
    buf.set(openingKey, 0);
    buf.set(encoder.encode(discriminator), SECRET_LENGTH);
    // varint(index) starts at the fixed domain-separator offset (after the 12-byte discriminator).
    let offset = SECRET_LENGTH + DISCRIMINATOR_LENGTH;
    let value = index;
    do {
        let byte = value & 0x7f;
        value = Math.floor(value / 128);
        if (value > 0) {
            byte |= 0x80;
        }
        buf[offset] = byte;
        offset += 1;
    } while (value > 0);

    return keccak2(buf);
};

/**
 * Decrypt the device's encrypted CLSAG signatures, in signing order, given the transaction's
 * `opening_key` (hex) from the FinalAck. Returns the plaintext signatures (hex), ready for assembly.
 */
export const decryptSignatures = (openingKeyHex: string, signatures: string[]): string[] => {
    const openingKey = hexToBytes(openingKeyHex);
    if (openingKey.length !== SECRET_LENGTH) {
        throw new Error(
            `decryptSignatures: opening_key must be 32 bytes (got ${openingKey.length})`,
        );
    }

    return signatures.map((signatureHex, index) => {
        const key = buildKey(openingKey, 'sig-key', index);
        const iv = buildKey(openingKey, 'sig-iv', index).slice(0, IV_LENGTH);
        // decrypt() verifies the Poly1305 tag and throws on mismatch (wrong key / corrupted blob).
        const plain = chacha20poly1305(key, iv).decrypt(hexToBytes(signatureHex));

        return bytesToHex(stripLeadingVarint(plain));
    });
};
