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

import { type WebauthnCredentialIdStorage } from './credentialIdStorage';
import { bytesToHex, getRandomBytes, hexToBytes } from './hex';

const KEY_SALT_LENGTH = 32;
const IV_LENGTH = 12;
const HKDF_INFO = 'trezor-suite-platform-encryption';
// A fixed PRF input makes the passkey yield the same secret on every evaluation and device.
const PRF_INPUT_HEX = bytesToHex(new TextEncoder().encode('trezor-suite/platform-encryption/v1'));

export type WebauthnPlatformEncryptionDeps = WebauthnAuthenticatorDep & {
    credentialIdStorage: WebauthnCredentialIdStorage;
};

type DeriveMessageKeyParams = {
    rootKey: CryptoKey;
    salt: Uint8Array<ArrayBuffer>;
};

const deriveMessageKey = ({ rootKey, salt }: DeriveMessageKeyParams) =>
    crypto.subtle.deriveKey(
        { name: 'HKDF', hash: 'SHA-256', salt, info: new TextEncoder().encode(HKDF_INFO) },
        rootKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt'],
    );

export const createWebauthnPlatformEncryption = (
    deps: WebauthnPlatformEncryptionDeps,
): PlatformEncryption => {
    let rootKeyPromise: Promise<Result<CryptoKey, EncryptionUnavailable>> | undefined;

    const evaluateRootKey = async (
        credentialIdHex: string,
    ): Promise<Result<CryptoKey, EncryptionUnavailable>> => {
        const prfResult = await deps.webauthnAuthenticator.evaluatePrf({
            credentialIdHex,
            saltHex: PRF_INPUT_HEX,
        });
        if (!prfResult.success) {
            return prfResult;
        }

        const secret = hexToBytes(prfResult.payload);
        if (secret === undefined || secret.length === 0) {
            return err(EncryptionUnavailable('The authenticator returned an invalid PRF output'));
        }

        const rootKey = await crypto.subtle.importKey('raw', secret, 'HKDF', false, ['deriveKey']);

        return ok(rootKey);
    };

    const createRootKey = async (): Promise<Result<CryptoKey, EncryptionUnavailable>> => {
        const storedCredentialIdHex = deps.credentialIdStorage.getCredentialId();
        if (storedCredentialIdHex !== null) {
            return evaluateRootKey(storedCredentialIdHex);
        }

        const credentialResult = await deps.webauthnAuthenticator.createCredential();
        if (!credentialResult.success) {
            return credentialResult;
        }

        if (credentialResult.payload.isPrfEnabled === false) {
            return err(
                EncryptionUnavailable('The authenticator does not support the PRF extension'),
            );
        }

        const rootKeyResult = await evaluateRootKey(credentialResult.payload.credentialIdHex);
        if (rootKeyResult.success) {
            deps.credentialIdStorage.setCredentialId(credentialResult.payload.credentialIdHex);
        }

        return rootKeyResult;
    };

    // The passkey is asked once per session: the root key stays in memory, non-extractable.
    const getRootKey = async (): Promise<Result<CryptoKey, EncryptionUnavailable>> => {
        rootKeyPromise ??= createRootKey();
        const rootKeyResult = await rootKeyPromise;
        if (!rootKeyResult.success) {
            rootKeyPromise = undefined;
        }

        return rootKeyResult;
    };

    const encrypt = async <T extends EncryptableBranded>({
        value,
    }: EncryptParams<T>): Promise<Result<EncryptedHex<T>, EncryptionError>> => {
        const rootKeyResult = await getRootKey();
        if (!rootKeyResult.success) {
            return rootKeyResult;
        }

        const salt = getRandomBytes(KEY_SALT_LENGTH);
        const iv = getRandomBytes(IV_LENGTH);
        const messageKey = await deriveMessageKey({ rootKey: rootKeyResult.payload, salt });
        const ciphertext = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            messageKey,
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
        if (bytes === undefined || bytes.length <= KEY_SALT_LENGTH + IV_LENGTH) {
            return err(DecryptionFailed());
        }

        if (deps.credentialIdStorage.getCredentialId() === null) {
            return err(EncryptionUnavailable('No WebAuthn credential is registered'));
        }

        const rootKeyResult = await getRootKey();
        if (!rootKeyResult.success) {
            return rootKeyResult;
        }

        const salt = bytes.slice(0, KEY_SALT_LENGTH);
        const iv = bytes.subarray(KEY_SALT_LENGTH, KEY_SALT_LENGTH + IV_LENGTH);
        const ciphertext = bytes.subarray(KEY_SALT_LENGTH + IV_LENGTH);
        const messageKey = await deriveMessageKey({ rootKey: rootKeyResult.payload, salt });

        let plaintext: ArrayBuffer;
        try {
            plaintext = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                messageKey,
                ciphertext,
            );
        } catch {
            return err(DecryptionFailed());
        }

        return ok(new TextDecoder().decode(plaintext) as T);
    };

    return { encrypt, decrypt };
};
