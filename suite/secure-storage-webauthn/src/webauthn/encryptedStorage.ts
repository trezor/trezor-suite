import { base64URLStringToBuffer } from '@simplewebauthn/browser';

import { decrypt, deriveEncryptionKey, encrypt } from './crypto';
import { getWebAuthnCredentials, isWebAuthnFullySupported, WebAuthnCredentialId } from './webAuthn';

let cachedEncryptionKey: Uint8Array | null = null;
let cachedSalt: string | null = null;

// TODO: use web worker for encryption-related processes:
export const retrieveEncryptionKeyAndSalt = async ({
    credential,
}: {
    credential: WebAuthnCredentialId;
}) => {
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
};

export const clearCachedEncryptionKeyAndSalt = () => {
    cachedEncryptionKey = null;
    cachedSalt = null;
};

export const encryptWithWebAuthn = async (plaintext: Uint8Array) => {
    const { encryptionKey } = await retrieveEncryptionKeyAndSalt();

    const { nonce, ciphertext } = encrypt(encryptionKey, plaintext);

    return { nonce, ciphertext };
};

export const decryptWithWebAuthn = async (ciphertext: Uint8Array, nonce: Uint8Array) => {
    if (!cachedEncryptionKey || !cachedSalt) {
        const { encryptionKey, salt } = await retrieveEncryptionKeyAndSalt();

        cachedEncryptionKey = encryptionKey;
        cachedSalt = salt;
    }

    return decrypt(cachedEncryptionKey, nonce, ciphertext);
};

export const enableEncryptedStorage = async () => {
    if (await isEncryptedStorageEnabled()) {
        return;
    }

    const { encryptionKey, salt } = await retrieveEncryptionKeyAndSalt();

    console.log('Starting encryption process:', { salt, encryptionKey });

    await getStore('encryptedStorage').set('salt', salt);
    await getStore('encryptedStorage').set('enabled', true);
};

export const disableEncryptedStorage = async () => {
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
};
