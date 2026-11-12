import type {
    CreateCredentialResult,
    GetCredentialResult,
    WebauthnCreateRequestOptions,
    WebauthnGetRequestOptions,
} from 'electron-webauthn';

import {
    EncryptionUnavailable,
    type WebauthnAuthenticator,
} from '@suite-common/platform-encryption';
import { type Result, err, ok } from '@trezor/type-utils';

const RELYING_PARTY_NAME = 'Trezor Suite';
const USER_NAME = 'Trezor Suite';
const CHALLENGE_LENGTH = 32;
const USER_ID_LENGTH = 16;
const REQUEST_TIMEOUT_MS = 60_000;

export type NativeWebauthnAuthenticatorDeps = {
    relyingPartyId: string;
    getNativeWindowHandle: () => Buffer | undefined;
    createCredential: (
        publicKeyOptions: PublicKeyCredentialCreationOptions,
        additionalOptions: WebauthnCreateRequestOptions,
    ) => Promise<CreateCredentialResult>;
    getCredential: (
        publicKeyOptions: PublicKeyCredentialRequestOptions,
        additionalOptions: WebauthnGetRequestOptions,
    ) => Promise<GetCredentialResult>;
    getRandomBytes: (length: number) => Uint8Array<ArrayBuffer>;
};

const base64UrlToHex = (value: string) => Buffer.from(value, 'base64url').toString('hex');

const hexToBytes = (value: string) => new Uint8Array(Buffer.from(value, 'hex'));

const describeFailure = (result: { error: string; errorObject?: Error }) =>
    result.errorObject ? `${result.error}: ${result.errorObject.message}` : result.error;

const describeError = (error: unknown) =>
    error instanceof Error ? `${error.name}: ${error.message}` : String(error);

/** The native module may fail to load or bind, e.g. below macOS 15, which must not reject. */
const callNative = async <T>(call: () => Promise<T>): Promise<Result<T, EncryptionUnavailable>> => {
    try {
        return ok(await call());
    } catch (error) {
        return err(
            EncryptionUnavailable(`The passkey API is not available: ${describeError(error)}`),
        );
    }
};

/**
 * Runs WebAuthn through the operating system's passkey API instead of Chromium's, because
 * Electron's own platform authenticators on macOS ignore the PRF extension.
 */
export const createNativeWebauthnAuthenticator = (
    deps: NativeWebauthnAuthenticatorDeps,
): WebauthnAuthenticator => {
    const getRequestOptions = () => {
        const nativeWindowHandle = deps.getNativeWindowHandle();

        return nativeWindowHandle === undefined
            ? undefined
            : {
                  currentOrigin: `https://${deps.relyingPartyId}`,
                  topFrameOrigin: undefined,
                  nativeWindowHandle,
              };
    };

    return {
        createCredential: async () => {
            const requestOptions = getRequestOptions();
            if (requestOptions === undefined) {
                return err(EncryptionUnavailable('No window to show the passkey prompt in'));
            }

            const nativeResult = await callNative(() =>
                deps.createCredential(
                    {
                        rp: { id: deps.relyingPartyId, name: RELYING_PARTY_NAME },
                        user: {
                            id: deps.getRandomBytes(USER_ID_LENGTH),
                            name: USER_NAME,
                            displayName: USER_NAME,
                        },
                        challenge: deps.getRandomBytes(CHALLENGE_LENGTH),
                        pubKeyCredParams: [
                            { type: 'public-key', alg: -7 },
                            { type: 'public-key', alg: -257 },
                        ],
                        authenticatorSelection: {
                            residentKey: 'preferred',
                            userVerification: 'preferred',
                        },
                        attestation: 'none',
                        timeout: REQUEST_TIMEOUT_MS,
                        extensions: { prf: {} },
                    },
                    requestOptions,
                ),
            );
            if (!nativeResult.success) {
                return nativeResult;
            }
            const result = nativeResult.payload;
            if (!result.success) {
                return err(
                    EncryptionUnavailable(`Credential creation failed: ${describeFailure(result)}`),
                );
            }

            return ok({
                credentialIdHex: base64UrlToHex(result.data.credentialId),
                isPrfEnabled: result.data.extensions.prf?.enabled,
            });
        },

        evaluatePrf: async params => {
            const requestOptions = getRequestOptions();
            if (requestOptions === undefined) {
                return err(EncryptionUnavailable('No window to show the passkey prompt in'));
            }

            const nativeResult = await callNative(() =>
                deps.getCredential(
                    {
                        rpId: deps.relyingPartyId,
                        challenge: deps.getRandomBytes(CHALLENGE_LENGTH),
                        allowCredentials: [
                            { type: 'public-key', id: hexToBytes(params.credentialIdHex) },
                        ],
                        userVerification: 'preferred',
                        timeout: REQUEST_TIMEOUT_MS,
                        extensions: { prf: { eval: { first: hexToBytes(params.saltHex) } } },
                    },
                    requestOptions,
                ),
            );
            if (!nativeResult.success) {
                return nativeResult;
            }
            const result = nativeResult.payload;
            if (!result.success) {
                return err(EncryptionUnavailable(`Assertion failed: ${describeFailure(result)}`));
            }

            const prfOutput = result.data.extensions?.prf?.results?.first;
            if (prfOutput === undefined) {
                return err(EncryptionUnavailable('The assertion carries no PRF output'));
            }

            return ok(base64UrlToHex(prfOutput));
        },
    };
};
