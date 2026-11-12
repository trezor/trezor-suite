import {
    EncryptionUnavailable,
    type WebauthnAuthenticator,
    type WebauthnCredential,
} from '@suite-common/platform-encryption';
import { type Result, err, ok } from '@trezor/type-utils';

import { bytesToHex, getRandomBytes, hexToBytes } from './hex';

const RELYING_PARTY_NAME = 'Trezor Suite';
const USER_NAME = 'Trezor Suite';
const CHALLENGE_LENGTH = 32;
const USER_ID_LENGTH = 16;
const REQUEST_TIMEOUT_MS = 60_000;

type PublicKeyCredentialLike = Pick<PublicKeyCredential, 'rawId' | 'getClientExtensionResults'>;

export type BrowserWebauthnAuthenticatorDeps = {
    isWebauthnAvailable: () => boolean;
    getRelyingPartyId: () => string;
    createCredential: (options: CredentialCreationOptions) => Promise<Credential | null>;
    getCredential: (options: CredentialRequestOptions) => Promise<Credential | null>;
};

const getErrorMessage = (error: unknown): string =>
    error instanceof Error ? `${error.name}: ${error.message}` : String(error);

const isPublicKeyCredential = (
    credential: Credential | null,
): credential is Credential & PublicKeyCredentialLike =>
    credential?.type === 'public-key' &&
    'rawId' in credential &&
    'getClientExtensionResults' in credential;

export const createBrowserWebauthnAuthenticator = (
    deps: BrowserWebauthnAuthenticatorDeps,
): WebauthnAuthenticator => {
    const createCredential = async (): Promise<
        Result<WebauthnCredential, EncryptionUnavailable>
    > => {
        if (!deps.isWebauthnAvailable()) {
            return err(EncryptionUnavailable('WebAuthn is not available in this context'));
        }

        let credential: Credential | null;
        try {
            credential = await deps.createCredential({
                signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
                publicKey: {
                    rp: { id: deps.getRelyingPartyId(), name: RELYING_PARTY_NAME },
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
            return err(
                EncryptionUnavailable(`Credential creation failed: ${getErrorMessage(error)}`),
            );
        }

        if (!isPublicKeyCredential(credential)) {
            return err(EncryptionUnavailable('No credential was created'));
        }

        return ok({
            credentialIdHex: bytesToHex(new Uint8Array(credential.rawId)),
            isPrfEnabled: credential.getClientExtensionResults().prf?.enabled,
        });
    };

    const evaluatePrf: WebauthnAuthenticator['evaluatePrf'] = async params => {
        if (!deps.isWebauthnAvailable()) {
            return err(EncryptionUnavailable('WebAuthn is not available in this context'));
        }

        const credentialId = hexToBytes(params.credentialIdHex);
        const salt = hexToBytes(params.saltHex);
        if (credentialId === undefined || salt === undefined) {
            return err(EncryptionUnavailable('Invalid credential id or salt'));
        }

        let assertion: Credential | null;
        try {
            assertion = await deps.getCredential({
                signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
                publicKey: {
                    rpId: deps.getRelyingPartyId(),
                    challenge: getRandomBytes(CHALLENGE_LENGTH),
                    allowCredentials: [{ type: 'public-key', id: credentialId }],
                    userVerification: 'discouraged',
                    extensions: { prf: { eval: { first: salt } } },
                },
            });
        } catch (error) {
            return err(EncryptionUnavailable(`Assertion failed: ${getErrorMessage(error)}`));
        }

        if (!isPublicKeyCredential(assertion)) {
            return err(EncryptionUnavailable('No assertion was returned'));
        }

        const prfOutput = assertion.getClientExtensionResults().prf?.results?.first;
        if (!(prfOutput instanceof ArrayBuffer)) {
            return err(EncryptionUnavailable('The assertion carries no PRF output'));
        }

        return ok(bytesToHex(new Uint8Array(prfOutput)));
    };

    return { createCredential, evaluatePrf };
};

export const createNavigatorWebauthnDeps = (): BrowserWebauthnAuthenticatorDeps => ({
    isWebauthnAvailable: () =>
        window.isSecureContext &&
        typeof PublicKeyCredential !== 'undefined' &&
        navigator.credentials !== undefined,
    getRelyingPartyId: () => window.location.hostname,
    createCredential: options => navigator.credentials.create(options),
    getCredential: options => navigator.credentials.get(options),
});
