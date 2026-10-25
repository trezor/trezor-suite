import {
    type Credential,
    type CredentialsResponseValidation,
    WabiSabiClient,
    deserializeCredentialsResponse,
    deserializeIssuerParameters,
    secureRandom,
    serializeCredentialsRequest,
} from '@trezor/wabisabi-crypto';

import {
    type CredentialsResponseData,
    type IssuerParameter,
    type RealCredentials,
    type ZeroCredentials,
} from '../types/coordinator';

/**
 * The WabiSabi credential protocol, in process.
 *
 * These three functions replace the `get-zero-credential-requests`,
 * `get-real-credential-requests` and `get-credentials` endpoints of the
 * `WalletWasabi.WabiSabiClientLibrary` binary, which Suite used to spawn on a localhost
 * port and drive over plain HTTP. Nothing here talks to the network.
 *
 * The transcript inside `CredentialsResponseValidation` is a live object held in round
 * state between building a request and handling the coordinator's response. It is safe to
 * keep it live because it never crosses IPC and is never persisted: `Alice.toSerialized`
 * emits only `accountKey`, `path`, `outpoint` and `error`, and `SerializedCoinjoinRound`
 * carries no credential data at all.
 *
 * What goes on the wire is `CredentialsRequest`, already serialized to the byte-identical
 * shape the coordinator expects — PascalCase keys, uppercase hex.
 */

const getClient = (issuer: IssuerParameter, maxCredentialValue: number) =>
    new WabiSabiClient(deserializeIssuerParameters(issuer), secureRandom, maxCredentialValue);

/** `get-zero-credential-requests`: `k` zero-value credentials, the null request. */
export const getZeroCredentials = (
    issuer: IssuerParameter,
    maxCredentialValue: number,
): ZeroCredentials => {
    const { credentialsRequest, credentialsResponseValidation } = getClient(
        issuer,
        maxCredentialValue,
    ).createRequestForZeroAmount();

    return {
        CredentialsRequest: serializeCredentialsRequest(credentialsRequest),
        CredentialsResponseValidation: credentialsResponseValidation,
    };
};

/**
 * `get-real-credential-requests`.
 *
 * An empty `amountsToRequest` is the presentation-only request: it creates no issuance
 * requests, which is what output registration needs.
 */
export const getRealCredentials = (
    amountsToRequest: number[],
    credentialsToPresent: Credential[],
    issuer: IssuerParameter,
    maxCredentialValue: number,
): RealCredentials => {
    const { credentialsRequest, credentialsResponseValidation } = getClient(
        issuer,
        maxCredentialValue,
    ).createRequest(amountsToRequest, credentialsToPresent);

    return {
        CredentialsRequest: serializeCredentialsRequest(credentialsRequest),
        CredentialsResponseValidation: credentialsResponseValidation,
    };
};

/**
 * `get-credentials`.
 *
 * Verifies the issuer-parameters proof for every issued credential against the transcript
 * the request was built with, and throws if any of them does not hold — a response the
 * coordinator could not have produced with its advertised key must not yield a credential
 * the caller goes on to present.
 */
export const getCredentials = (
    issuer: IssuerParameter,
    maxCredentialValue: number,
    credentialsResponse: CredentialsResponseData,
    credentialsValidationData: CredentialsResponseValidation,
): Credential[] =>
    getClient(issuer, maxCredentialValue).handleResponse(
        deserializeCredentialsResponse(credentialsResponse),
        credentialsValidationData,
    );

/**
 * Hands the event loop back between independent credential computations.
 *
 * A width-42 range proof is a few thousand secp256k1 multiplications, and in the desktop
 * build they now run on the Electron main process event loop, which also serves device
 * IPC. Awaiting this between proofs keeps a phase from blocking it end to end. See the
 * per-phase numbers in `tools/benchmark-test.ts`.
 */
export const yieldToEventLoop = () => new Promise<void>(resolve => setTimeout(resolve, 0));
