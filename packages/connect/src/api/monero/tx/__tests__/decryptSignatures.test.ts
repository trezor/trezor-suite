import { chacha20poly1305 } from '@noble/ciphers/chacha.js';
import { keccak_256 } from '@noble/hashes/sha3.js';

import { decryptSignatures } from '../decryptSignatures';
import { bytesToHex } from '../hex';

// Independently reproduce the firmware key derivation (offloading_keys._build_key + key_signature)
// to encrypt a signature exactly as the device does, so decryptSignatures round-trips.
const keccak2 = (data: Uint8Array) => keccak_256(keccak_256(data));
const buildKey = (openingKey: Uint8Array, discriminator: string, index: number) => {
    const buf = new Uint8Array(48);
    buf.set(openingKey, 0);
    buf.set(new TextEncoder().encode(discriminator), 32);
    let offset = 44;
    let value = index;
    do {
        let byte = value & 0x7f;
        value = Math.floor(value / 128);
        if (value > 0) byte |= 0x80;
        buf[offset++] = byte;
    } while (value > 0);

    return keccak2(buf);
};
// The device encrypts mg_buffer = varint(ring_size) || s... || c1 || D; for ring 16 the leading
// varint is the single byte 0x10. decryptSignatures must strip it to yield the wire signature.
const encryptSignature = (openingKey: Uint8Array, index: number, plain: Uint8Array) => {
    const key = buildKey(openingKey, 'sig-key', index);
    const iv = buildKey(openingKey, 'sig-iv', index).slice(0, 12);
    const mgBuffer = Uint8Array.from([0x10, ...plain]); // ring-size(16) varint prefix + signature

    return bytesToHex(chacha20poly1305(key, iv).encrypt(mgBuffer));
};

const openingKey = new Uint8Array(32).fill(0x5a);

describe('decryptSignatures', () => {
    it('decrypts each per-input signature using its signing-order index', () => {
        // 16 s-scalars + c1 + D = 576 bytes per CLSAG (ring size 16).
        const sig0 = new Uint8Array(576).fill(0x11);
        const sig1 = new Uint8Array(576).fill(0x22);

        const encrypted = [
            encryptSignature(openingKey, 0, sig0),
            encryptSignature(openingKey, 1, sig1),
        ];

        const decrypted = decryptSignatures(bytesToHex(openingKey), encrypted);

        expect(decrypted).toEqual([bytesToHex(sig0), bytesToHex(sig1)]);
    });

    it('fails the Poly1305 tag when the wrong index (key) is used', () => {
        const sig = new Uint8Array(576).fill(0x33);
        // Encrypt at index 1 but the decryptor will derive index 0's key for the first element.
        const encrypted = [encryptSignature(openingKey, 1, sig)];

        expect(() => decryptSignatures(bytesToHex(openingKey), encrypted)).toThrow();
    });

    it('rejects an opening key that is not 32 bytes', () => {
        expect(() => decryptSignatures('00'.repeat(16), ['00'])).toThrow('must be 32 bytes');
    });
});
