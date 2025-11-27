import { base64URLStringToBuffer } from '@simplewebauthn/browser';

import { decrypt, deriveEncryptionKey, encrypt } from './crypto';
import { getStore } from './storage';
import { getWebAuthnCredentials, isWebAuthnFullySupported } from './webAuthn';

export async function isEncryptedStorageEnabled() {
    if (!(await isWebAuthnFullySupported())) {
        return false;
    }

    return await getStore('encryptedStorage').get('enabled');
}

let cachedEncryptionKey: Uint8Array | null = null;
let cachedSalt: string | null = null;

// TODO: use web worker for encryption-related processes
export async function retrieveEncryptionKeyAndSalt() {
    if (cachedEncryptionKey && cachedSalt) {
        return { encryptionKey: cachedEncryptionKey, salt: cachedSalt };
    }

    const credentials = await getStore('webauthn').get('credentials');

    if (credentials.length === 0) {
        throw new Error('No WebAuthn credentials found');
    }

    const oldSalt = await getStore('encryptedStorage').get('salt');

    const oldSaltBuffer = oldSalt ? new Uint8Array(base64URLStringToBuffer(oldSalt)) : null;
    const credentialWithSeed = await getWebAuthnCredentials(credentials, oldSaltBuffer);
    const { salt, seed } = credentialWithSeed;
    const encryptionKey = deriveEncryptionKey(seed);

    cachedEncryptionKey = encryptionKey;
    cachedSalt = salt;

    return { encryptionKey, salt };
}

export function clearCachedEncryptionKeyAndSalt() {
    cachedEncryptionKey = null;
    cachedSalt = null;
}

export async function encryptWithWebAuthn(plaintext: Uint8Array) {
    const { encryptionKey } = await retrieveEncryptionKeyAndSalt();

    const { nonce, ciphertext } = encrypt(encryptionKey, plaintext);

    return { nonce, ciphertext };
}

export async function decryptWithWebAuthn(ciphertext: Uint8Array, nonce: Uint8Array) {
    if (!cachedEncryptionKey || !cachedSalt) {
        const { encryptionKey, salt } = await retrieveEncryptionKeyAndSalt();

        cachedEncryptionKey = encryptionKey;
        cachedSalt = salt;
    }

    return decrypt(cachedEncryptionKey, nonce, ciphertext);
}

export async function enableEncryptedStorage() {
    if (await isEncryptedStorageEnabled()) {
        return;
    }

    const { encryptionKey, salt } = await retrieveEncryptionKeyAndSalt();

    console.log('Starting encryption process:', { salt, encryptionKey });

    await getStore('encryptedStorage').set('salt', salt);
    await getStore('encryptedStorage').set('enabled', true);
}

export async function disableEncryptedStorage() {
    if (!(await isEncryptedStorageEnabled())) {
        return;
    }

    const credentials = await getStore('webauthn').get('credentials');

    if (credentials.length === 0) {
        console.error(new Error('No WebAuthn credentials found'));

        return;
    }

    const oldSalt = await getStore('encryptedStorage').get('salt');

    if (!oldSalt) {
        console.error(new Error('No old salt found'));

        return;
    }

    // const { salt, encryptionKey } = await retrieveEncryptionKeyAndSalt();

    // TODO: start decryption process
    // console.log('Starting decryption process:', { salt, encryptionKey });

    clearCachedEncryptionKeyAndSalt();

    await getStore('encryptedStorage').set('salt', null);
    await getStore('encryptedStorage').set('enabled', false);
}
