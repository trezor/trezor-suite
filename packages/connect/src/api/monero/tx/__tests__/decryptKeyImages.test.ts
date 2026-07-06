import { chacha20poly1305 } from '@noble/ciphers/chacha.js';

import { decryptKeyImages } from '../decryptKeyImages';
import { bytesToHex } from '../hex';

const encKey = new Uint8Array(32).fill(7);
const iv = new Uint8Array(12).fill(3);

// Encrypt a (key_image || signature) plaintext exactly as the device does, so decrypt round-trips.
const encrypt = (keyImage: Uint8Array, signature: Uint8Array) =>
    bytesToHex(chacha20poly1305(encKey, iv).encrypt(Uint8Array.from([...keyImage, ...signature])));

describe('decryptKeyImages', () => {
    it('recovers the 32-byte key image and 64-byte signature from each blob', () => {
        const kiA = new Uint8Array(32).fill(0xab);
        const kiB = new Uint8Array(32).fill(0xcd);
        const sigA = new Uint8Array(64).fill(0x11);
        const sigB = new Uint8Array(64).fill(0x22);

        const result = decryptKeyImages(bytesToHex(encKey), [
            { iv: bytesToHex(iv), blob: encrypt(kiA, sigA) },
            { iv: bytesToHex(iv), blob: encrypt(kiB, sigB) },
        ]);

        expect(result).toEqual([
            { keyImage: kiA, signature: sigA },
            { keyImage: kiB, signature: sigB },
        ]);
    });

    it('throws when the Poly1305 tag does not verify (corrupted blob)', () => {
        const blob = chacha20poly1305(encKey, iv).encrypt(new Uint8Array(96).fill(1));
        blob[0] = (blob[0] ?? 0) ^ 0xff; // tamper

        expect(() =>
            decryptKeyImages(bytesToHex(encKey), [{ iv: bytesToHex(iv), blob: bytesToHex(blob) }]),
        ).toThrow();
    });
});
