// Decrypt the key images the device exports via moneroKeyImageSync.
//
// The device never returns raw key images: each is encrypted with ChaCha20-Poly1305 under a single
// per-sync key (`enc_key`) and its own 12-byte nonce (`iv`). The decrypted plaintext is the 32-byte
// key image followed by its 64-byte spend signature (sig.c || sig.r). The transaction-signing flow
// needs only the key image (to order + assemble the tx), but importing the key images into the
// scanning wallet (wallet2 `import_key_images`, to learn the true spent status) requires the
// signature too — it is verified against the output's public key. The cipher + 96-byte layout match
// the reference (ph4r05/monero-agent + monero `device_trezor` ki_sync), so the round-trip is
// verifiable offline; that the device's enc_key/iv/blob follow this layout is confirmed on hardware.
import { chacha20poly1305 } from '@noble/ciphers/chacha.js';

import { hexToBytes } from './hex';

export interface EncryptedKeyImage {
    /** 12-byte ChaCha20-Poly1305 nonce, hex. */
    iv: string;
    /** Ciphertext: ChaCha20-Poly1305 of (key_image || signature) plus the 16-byte tag, hex. */
    blob: string;
}

/** A decrypted key image and its spend signature (both raw bytes). */
export interface DecryptedKeyImage {
    /** The 32-byte key image. */
    keyImage: Uint8Array;
    /** The 64-byte ring signature (sig.c || sig.r) proving the key image belongs to the output. */
    signature: Uint8Array;
}

const KEY_IMAGE_SIZE = 32;
const SIGNATURE_SIZE = 64;
const PLAINTEXT_SIZE = KEY_IMAGE_SIZE + SIGNATURE_SIZE;

export const decryptKeyImages = (
    encKeyHex: string,
    images: EncryptedKeyImage[],
): DecryptedKeyImage[] => {
    const key = hexToBytes(encKeyHex);

    return images.map((image, index) => {
        // decrypt() verifies the Poly1305 tag and throws on any mismatch (tampering / wrong key).
        const plain = chacha20poly1305(key, hexToBytes(image.iv)).decrypt(hexToBytes(image.blob));
        if (plain.length < PLAINTEXT_SIZE) {
            throw new Error(
                `decryptKeyImages: decrypted blob ${index} is too short (${plain.length} bytes)`,
            );
        }

        return {
            keyImage: plain.slice(0, KEY_IMAGE_SIZE),
            signature: plain.slice(KEY_IMAGE_SIZE, PLAINTEXT_SIZE),
        };
    });
};
