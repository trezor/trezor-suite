import {
    type DecryptParams,
    type DecryptionError,
    DecryptionFailed,
    type EncryptParams,
    type EncryptableBranded,
    type EncryptedHex,
    type EncryptionError,
    EncryptionUnavailable,
    type PlatformEncryption,
    type WebauthnAuthenticatorDep,
    asEncryptedHex,
} from '@suite-common/platform-encryption';
import { type Result, err, ok } from '@trezor/type-utils';

import { bytesToHex, getRandomBytes, hexToBytes } from './hex';

const CREDENTIAL_ID_STORAGE_KEY = 'trezor-suite-webauthn-credential-id';
const PRF_SALT_LENGTH = 32;
const IV_LENGTH = 12;
const HKDF_INFO = 'trezor-suite-platform-encryption';

export type WebauthnCredentialIdStorage = {
    getCredentialId: () => string | null;
    setCredentialId: (credentialIdHex: string) => void;
};

export type WebauthnPlatformEncryptionDeps = WebauthnAuthenticatorDep & {
    credentialIdStorage: WebauthnCredentialIdStorage;
};

type DeriveKeyParams = {
    credentialIdHex: string;
    salt: Uint8Array<ArrayBuffer>;
};

export const createWebauthnPlatformEncryption = (
    deps: WebauthnPlatformEncryptionDeps,
): PlatformEncryption => {
    const ensureCredentialId = async (): Promise<Result<string, EncryptionUnavailable>> => {
        const storedCredentialIdHex = deps.credentialIdStorage.getCredentialId();
        if (storedCredentialIdHex !== null) {
            return ok(storedCredentialIdHex);
        }

        const credentialResult = await deps.webauthnAuthenticator.createCredential();
        if (!credentialResult.success) {
            return credentialResult;
        }

        if (!credentialResult.payload.isPrfEnabled) {
            return err(
                EncryptionUnavailable('The authenticator does not support the PRF extension'),
            );
        }

        deps.credentialIdStorage.setCredentialId(credentialResult.payload.credentialIdHex);

        return ok(credentialResult.payload.credentialIdHex);
    };

    const deriveKey = async ({
        credentialIdHex,
        salt,
    }: DeriveKeyParams): Promise<Result<CryptoKey, EncryptionUnavailable>> => {
        const prfResult = await deps.webauthnAuthenticator.evaluatePrf({
            credentialIdHex,
            saltHex: bytesToHex(salt),
        });
        if (!prfResult.success) {
            return prfResult;
        }

        const secret = hexToBytes(prfResult.payload);
        if (secret === undefined) {
            return err(EncryptionUnavailable('The authenticator returned an invalid PRF output'));
        }

        const keyMaterial = await crypto.subtle.importKey('raw', secret, 'HKDF', false, [
            'deriveKey',
        ]);
        const key = await crypto.subtle.deriveKey(
            { name: 'HKDF', hash: 'SHA-256', salt, info: new TextEncoder().encode(HKDF_INFO) },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt'],
        );

        return ok(key);
    };

    const encrypt = async <T extends EncryptableBranded>({
        value,
    }: EncryptParams<T>): Promise<Result<EncryptedHex<T>, EncryptionError>> => {
        const credentialIdResult = await ensureCredentialId();
        if (!credentialIdResult.success) {
            return credentialIdResult;
        }

        const salt = getRandomBytes(PRF_SALT_LENGTH);
        const keyResult = await deriveKey({ credentialIdHex: credentialIdResult.payload, salt });
        if (!keyResult.success) {
            return keyResult;
        }

        const iv = getRandomBytes(IV_LENGTH);
        const ciphertext = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            keyResult.payload,
            new TextEncoder().encode(value),
        );

        return ok(
            asEncryptedHex<T>(
                bytesToHex(salt) + bytesToHex(iv) + bytesToHex(new Uint8Array(ciphertext)),
            ),
        );
    };

    const decrypt = async <T extends EncryptableBranded>({
        value,
    }: DecryptParams<T>): Promise<Result<T, DecryptionError>> => {
        const bytes = hexToBytes(value);
        if (bytes === undefined || bytes.length <= PRF_SALT_LENGTH + IV_LENGTH) {
            return err(DecryptionFailed());
        }

        const credentialIdHex = deps.credentialIdStorage.getCredentialId();
        if (credentialIdHex === null) {
            return err(EncryptionUnavailable('No WebAuthn credential is registered'));
        }

        const salt = bytes.slice(0, PRF_SALT_LENGTH);
        const iv = bytes.subarray(PRF_SALT_LENGTH, PRF_SALT_LENGTH + IV_LENGTH);
        const ciphertext = bytes.subarray(PRF_SALT_LENGTH + IV_LENGTH);

        const keyResult = await deriveKey({ credentialIdHex, salt });
        if (!keyResult.success) {
            return keyResult;
        }

        let plaintext: ArrayBuffer;
        try {
            plaintext = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                keyResult.payload,
                ciphertext,
            );
        } catch {
            return err(DecryptionFailed());
        }

        return ok(new TextDecoder().decode(plaintext) as T);
    };

    return { encrypt, decrypt };
};

export const createLocalStorageCredentialIdStorage = (): WebauthnCredentialIdStorage => ({
    getCredentialId: () => window.localStorage.getItem(CREDENTIAL_ID_STORAGE_KEY),
    setCredentialId: credentialIdHex =>
        window.localStorage.setItem(CREDENTIAL_ID_STORAGE_KEY, credentialIdHex),
});
