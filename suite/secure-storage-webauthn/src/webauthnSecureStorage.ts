import { bytesToHex, hexToBytes } from '@noble/ciphers/utils.js';

import {
    EncryptableBranded,
    EncryptedHex,
    EncryptionUnavailable,
    SecureStorage,
    asEncryptedHex,
} from '@suite-common/secure-storage';
import { err, ok } from '@trezor/type-utils';

import { decryptWithWebAuthn, encryptWithWebAuthn } from './webauthn/encryptedStorage';
import { createWebAuthnCredential, isWebAuthnFullySupported } from './webauthn/webAuthn';

type CreateWebauthnSecureStorageDeps = {
    getCredential: () => string | null;
};

export const createWebauthnSecureStorage = (
    deps: CreateWebauthnSecureStorageDeps,
): SecureStorage => ({
    encrypt: async <T extends EncryptableBranded>({ value }: { value: T }) => {
        if (!(await isWebAuthnFullySupported())) {
            return err(EncryptionUnavailable('WebAuthn features not supported'));
        }

        const credential = deps.getCredential()
        if (credential === null) {
            await createWebAuthnCredential()
        }

        const { nonce, ciphertext } = await encryptWithWebAuthn(new TextEncoder().encode(value));

        const encrypted = { ciphertext: bytesToHex(ciphertext), nonce: bytesToHex(nonce) };

        return ok(asEncryptedHex(JSON.stringify(encrypted) as T));
    },

    decrypt: async <T extends EncryptableBranded>({ value }: { value: EncryptedHex<T> }) => {
        if (!(await isWebAuthnFullySupported())) {
            return err(EncryptionUnavailable('WebAuthn features not supported'));
        }

        const { nonce, ciphertext } = JSON.parse(value);

        const plaintext = await decryptWithWebAuthn(hexToBytes(ciphertext), hexToBytes(nonce));

        return ok(new TextDecoder().decode(plaintext) as unknown as T);
    },
});
