import {
    type DecryptParams,
    type DecryptionError,
    DecryptionFailed,
    type EncryptParams,
    type EncryptableBranded,
    type EncryptedHex,
    type EncryptionError,
    EncryptionLocked,
    EncryptionUnavailable,
    type PlatformEncryption,
    type WebauthnAuthenticatorDep,
    asEncryptedHex,
} from '@suite-common/platform-encryption';
import { type Result, err, ok } from '@trezor/type-utils';

import { type WebauthnCredentialIdStorage } from './credentialIdStorage';
import { bytesToHex, getRandomBytes, hexToBytes } from './hex';

const FORMAT_VERSION = 1;
const KEY_SALT_LENGTH = 32;
const IV_LENGTH = 12;
const HEADER_LENGTH = 1 + KEY_SALT_LENGTH + IV_LENGTH;
const HKDF_INFO = 'trezor-suite-platform-encryption';
// A fixed PRF input makes the passkey yield the same secret on every evaluation and device.
const PRF_INPUT_HEX = bytesToHex(new TextEncoder().encode('trezor-suite/platform-encryption/v1'));
// After a refused or failed prompt, no new prompt is shown for this long.
export const PROMPT_COOLDOWN_MS = 5_000;

export type WebauthnPlatformEncryptionDeps = WebauthnAuthenticatorDep & {
    credentialIdStorage: WebauthnCredentialIdStorage;
    now: () => number;
};

/** @serviceContract */
export type LockablePlatformEncryption = PlatformEncryption & {
    /** Drops the root key, so the next operation asks the passkey again. */
    lock: () => void;
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

const getAdditionalData = (context: string | undefined) =>
    new TextEncoder().encode(`${FORMAT_VERSION}:${context ?? ''}`);

export const createWebauthnPlatformEncryption = (
    deps: WebauthnPlatformEncryptionDeps,
): LockablePlatformEncryption => {
    let rootKeyPromise: Promise<Result<CryptoKey, EncryptionError>> | undefined;
    let cooldownUntil = 0;

    const evaluateRootKey = async (
        credentialIdHex: string,
    ): Promise<Result<CryptoKey, EncryptionError>> => {
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

    const createRootKey = async (): Promise<Result<CryptoKey, EncryptionError>> => {
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
    const getRootKey = async (): Promise<Result<CryptoKey, EncryptionError>> => {
        if (rootKeyPromise === undefined && deps.now() < cooldownUntil) {
            return err(EncryptionLocked('The passkey was refused a moment ago'));
        }

        rootKeyPromise ??= createRootKey();
        const rootKeyResult = await rootKeyPromise;
        if (!rootKeyResult.success) {
            rootKeyPromise = undefined;
            cooldownUntil = deps.now() + PROMPT_COOLDOWN_MS;
        }

        return rootKeyResult;
    };

    const encrypt = async <T extends EncryptableBranded>({
        value,
        context,
    }: EncryptParams<T>): Promise<Result<EncryptedHex<T>, EncryptionError>> => {
        const rootKeyResult = await getRootKey();
        if (!rootKeyResult.success) {
            return rootKeyResult;
        }

        const salt = getRandomBytes(KEY_SALT_LENGTH);
        const iv = getRandomBytes(IV_LENGTH);
        const messageKey = await deriveMessageKey({ rootKey: rootKeyResult.payload, salt });
        const ciphertext = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv, additionalData: getAdditionalData(context) },
            messageKey,
            new TextEncoder().encode(value),
        );

        return ok(
            asEncryptedHex<T>(
                bytesToHex(new Uint8Array([FORMAT_VERSION])) +
                    bytesToHex(salt) +
                    bytesToHex(iv) +
                    bytesToHex(new Uint8Array(ciphertext)),
            ),
        );
    };

    const decrypt = async <T extends EncryptableBranded>({
        value,
        context,
    }: DecryptParams<T>): Promise<Result<T, DecryptionError>> => {
        const bytes = hexToBytes(value);
        if (bytes === undefined || bytes.length <= HEADER_LENGTH || bytes[0] !== FORMAT_VERSION) {
            return err(DecryptionFailed());
        }

        if (deps.credentialIdStorage.getCredentialId() === null) {
            return err(EncryptionUnavailable('No WebAuthn credential is registered'));
        }

        const rootKeyResult = await getRootKey();
        if (!rootKeyResult.success) {
            return rootKeyResult;
        }

        const salt = bytes.slice(1, 1 + KEY_SALT_LENGTH);
        const iv = bytes.subarray(1 + KEY_SALT_LENGTH, HEADER_LENGTH);
        const ciphertext = bytes.subarray(HEADER_LENGTH);
        const messageKey = await deriveMessageKey({ rootKey: rootKeyResult.payload, salt });

        let plaintext: ArrayBuffer;
        try {
            plaintext = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv, additionalData: getAdditionalData(context) },
                messageKey,
                ciphertext,
            );
        } catch {
            return err(DecryptionFailed());
        }

        return ok(new TextDecoder().decode(plaintext) as T);
    };

    const lock = () => {
        rootKeyPromise = undefined;
    };

    return { encrypt, decrypt, lock };
};
