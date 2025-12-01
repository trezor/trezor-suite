import { gcmsiv } from '@noble/ciphers/aes.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { sha3_256 } from '@noble/hashes/sha3.js';
import { base64URLStringToBuffer } from '@simplewebauthn/browser';
import { randomBytes } from 'crypto';

// TODO: audit this file to make sure keys are long enough, nonce used only once, etc.

export function deriveEncryptionKey(inputKeyMaterial: string) {
    const inputKeyMaterialBuffer = new Uint8Array(base64URLStringToBuffer(inputKeyMaterial));
    // salt is optional and we need deterministic key derivation
    const salt = new Uint8Array(0);
    const info = new TextEncoder().encode('');

    const key = hkdf(sha3_256, inputKeyMaterialBuffer, salt, info, 32);

    return key;
}

export function encrypt(key: Uint8Array, plaintext: Uint8Array) {
    const nonce = randomBytes(12);
    const ciphertext = gcmsiv(key, nonce).encrypt(plaintext);

    return { nonce, ciphertext };
}

export function decrypt(key: Uint8Array, nonce: Uint8Array, ciphertext: Uint8Array) {
    return gcmsiv(key, nonce).decrypt(ciphertext);
}
