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
    asEncryptedHex,
} from '@suite-common/platform-encryption';
import { type Result, err, ok } from '@trezor/type-utils';

const CREDENTIAL_ID_STORAGE_KEY = 'trezor-suite-webauthn-credential-id';
const RELYING_PARTY_NAME = 'Trezor Suite';
const USER_NAME = 'Trezor Suite';
const PRF_SALT_LENGTH = 32;
const IV_LENGTH = 12;
const CHALLENGE_LENGTH = 32;
const REQUEST_TIMEOUT_MS = 60_000;
const USER_ID_LENGTH = 16;
const HKDF_INFO = 'trezor-suite-platform-encryption';

const bytesToHex = (bytes: Uint8Array<ArrayBuffer>): string =>
    Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');

const hexToBytes = (hex: string): Uint8Array<ArrayBuffer> | undefined => {
    if (hex.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(hex)) {
        return undefined;
    }

    return Uint8Array.from(hex.match(/../g) ?? [], pair => parseInt(pair, 16));
};

const getRandomBytes = (length: number): Uint8Array<ArrayBuffer> =>
    crypto.getRandomValues(new Uint8Array(length));

const getErrorMessage = (error: unknown): string =>
    error instanceof Error ? `${error.name}: ${error.message}` : String(error);

const isWebauthnAvailable = (): boolean =>
    typeof window !== 'undefined' &&
    window.isSecureContext &&
    typeof PublicKeyCredential !== 'undefined' &&
    navigator.credentials !== undefined;

const getStoredCredentialId = (): Uint8Array<ArrayBuffer> | undefined => {
    const stored = window.localStorage.getItem(CREDENTIAL_ID_STORAGE_KEY);

    return stored === null ? undefined : hexToBytes(stored);
};

const createCredential = async (): Promise<
    Result<Uint8Array<ArrayBuffer>, EncryptionUnavailable>
> => {
    let credential: Credential | null;
    try {
        credential = await navigator.credentials.create({
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
            publicKey: {
                rp: { id: window.location.hostname, name: RELYING_PARTY_NAME },
                user: {
                    id: getRandomBytes(USER_ID_LENGTH),
                    name: USER_NAME,
                    displayName: USER_NAME,
                },
                challenge: getRandomBytes(CHALLENGE_LENGTH),
                pubKeyCredParams: [
                    { type: 'public-key', alg: -7 },
                    { type: 'public-key', alg: -257 },
                ],
                authenticatorSelection: {
                    residentKey: 'discouraged',
                    userVerification: 'discouraged',
                },
                attestation: 'none',
                extensions: { prf: {} },
            },
        });
    } catch (error) {
        return err(EncryptionUnavailable(`Credential creation failed: ${getErrorMessage(error)}`));
    }

    if (!(credential instanceof PublicKeyCredential)) {
        return err(EncryptionUnavailable('No credential was created'));
    }

    if (!credential.getClientExtensionResults().prf?.enabled) {
        return err(EncryptionUnavailable('The authenticator does not support the PRF extension'));
    }

    const credentialId = new Uint8Array(credential.rawId);
    window.localStorage.setItem(CREDENTIAL_ID_STORAGE_KEY, bytesToHex(credentialId));

    return ok(credentialId);
};

type DeriveKeyParams = {
    credentialId: Uint8Array<ArrayBuffer>;
    salt: Uint8Array<ArrayBuffer>;
};

const deriveKey = async ({
    credentialId,
    salt,
}: DeriveKeyParams): Promise<Result<CryptoKey, EncryptionUnavailable>> => {
    let assertion: Credential | null;
    try {
        assertion = await navigator.credentials.get({
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
            publicKey: {
                rpId: window.location.hostname,
                challenge: getRandomBytes(CHALLENGE_LENGTH),
                allowCredentials: [{ type: 'public-key', id: credentialId }],
                userVerification: 'discouraged',
                extensions: { prf: { eval: { first: salt } } },
            },
        });
    } catch (error) {
        return err(EncryptionUnavailable(`Assertion failed: ${getErrorMessage(error)}`));
    }

    if (!(assertion instanceof PublicKeyCredential)) {
        return err(EncryptionUnavailable('No assertion was returned'));
    }

    const secret = assertion.getClientExtensionResults().prf?.results?.first;
    if (secret === undefined) {
        return err(EncryptionUnavailable('The assertion carries no PRF output'));
    }

    const keyMaterial = await crypto.subtle.importKey('raw', secret, 'HKDF', false, ['deriveKey']);
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
    if (!isWebauthnAvailable()) {
        return err(EncryptionUnavailable('WebAuthn is not available in this context'));
    }

    const storedCredentialId = getStoredCredentialId();
    const credentialResult =
        storedCredentialId === undefined ? await createCredential() : ok(storedCredentialId);
    if (!credentialResult.success) {
        return credentialResult;
    }

    const salt = getRandomBytes(PRF_SALT_LENGTH);
    const keyResult = await deriveKey({ credentialId: credentialResult.payload, salt });
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
    if (!isWebauthnAvailable()) {
        return err(EncryptionUnavailable('WebAuthn is not available in this context'));
    }

    const bytes = hexToBytes(value);
    if (bytes === undefined || bytes.length <= PRF_SALT_LENGTH + IV_LENGTH) {
        return err(DecryptionFailed());
    }

    const credentialId = getStoredCredentialId();
    if (credentialId === undefined) {
        return err(EncryptionUnavailable('No WebAuthn credential is registered for this origin'));
    }

    const salt = bytes.subarray(0, PRF_SALT_LENGTH);
    const iv = bytes.subarray(PRF_SALT_LENGTH, PRF_SALT_LENGTH + IV_LENGTH);
    const ciphertext = bytes.subarray(PRF_SALT_LENGTH + IV_LENGTH);

    const keyResult = await deriveKey({ credentialId, salt });
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

export const createWebauthnPlatformEncryption = (): PlatformEncryption => ({ encrypt, decrypt });
