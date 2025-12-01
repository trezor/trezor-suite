import { randomBytes } from '@noble/ciphers/utils.js';
import {
    AuthenticatorTransportFuture,
    base64URLStringToBuffer,
    bufferToBase64URLString,
    startAuthentication,
    startRegistration,
} from '@simplewebauthn/browser';
import {
    generateAuthenticationOptions,
    generateRegistrationOptions,
    verifyAuthenticationResponse,
    verifyRegistrationResponse,
} from '@simplewebauthn/server';

import { Branded } from '@trezor/type-utils';

type ClientCapabilities = {
    conditionalCreate: boolean;
    conditionalGet: boolean;
    'extension:appid': boolean;
    'extension:appidExclude': boolean;
    'extension:credBlob': boolean;
    'extension:credProps': boolean;
    'extension:credentialProtectionPolicy': boolean;
    'extension:enforceCredentialProtectionPolicy': boolean;
    'extension:getCredBlob': boolean;
    'extension:hmacCreateSecret': boolean;
    'extension:largeBlob': boolean;
    'extension:minPinLength': boolean;
    'extension:payment': boolean;
    'extension:prf': boolean;
    hybridTransport: boolean;
    passkeyPlatformAuthenticator: boolean;
    relatedOrigins: boolean;
    signalAllAcceptedCredentials: boolean;
    signalCurrentUserDetails: boolean;
    signalUnknownCredential: boolean;
    userVerifyingPlatformAuthenticator: boolean;
};

export type WebAuthnCredentialId = string & Branded<WebAuthnCredentialId>;
export const asWebAuthnCredentialId = (input: string) => input as WebAuthnCredentialId;

export async function getWebAuthnFeatures() {
    if (!PublicKeyCredential.getClientCapabilities) {
        return null;
    }

    return (await PublicKeyCredential.getClientCapabilities()) as ClientCapabilities;
}

export const isWebAuthnFullySupported = async (): Promise<boolean> => {
    const features = await getWebAuthnFeatures();

    const supported =
        features !== null &&
        // PRF is required for deterministic key derivation
        features['extension:prf'] &&
        features['userVerifyingPlatformAuthenticator'] &&
        features['passkeyPlatformAuthenticator'];

    if (!features) {
        console.debug('WebAuthn features not supported', features);
    }

    return supported;
};

const getRpOrigin = () =>
    // TODO: use env var
    location.origin;

const getRpId = () => new URL(getRpOrigin()).hostname;

export const createWebAuthnCredential = async () => {
    // TODO: validate these variables have enough entropy
    const challenge = new Uint8Array(randomBytes(32));
    const userId = new Uint8Array(randomBytes(16));

    const publicKeyOptions = await generateRegistrationOptions({
        challenge,

        rpID: getRpId(),
        rpName: 'Trezor Suite',

        userID: userId,
        // TODO: add current wallet label/id/something to distuinguish between different public key credentials
        userName: 'Trezor Suite',

        /**
         * TODO:
         * Prevent creating multiple user passkeys on the same authenticator.
         */
        excludeCredentials: [],

        /**
         * Require authenticator to provide proof of its origin.
         */
        // attestationType: 'direct',

        // TODO: test this
        // 'preferredAuthenticatorType': 'localDevice',

        authenticatorSelection: {
            /**
             * User presense is not enough. Require user verification (e.g. PIN, fingerprint) to verify user identity.
             * If the authenticator does not support user verification, the registration will fail.
             */
            userVerification: 'required',

            /**
             * Require creating discoverable credentials (required for PRF).
             * The authenticator must generate and internally store a credential mapped to (rpID + userID).
             */
            residentKey: 'required',

            // TODO: determine based on client capabilities but prefer 'platform' if supported
            authenticatorAttachment: 'platform',
        },

        extensions: {
            // Enable PRF extension for deterministic key derivation
            // @ts-expect-error
            prf: {},
        },

        /**
         * Recommended range: 300_000 milliseconds to 600_000 milliseconds.
         * Recommended default value: 300_000 milliseconds (5 minutes).
         * https://www.w3.org/TR/webauthn-3/#sctn-createCredential
         */
        timeout: 300_000,
    });

    console.debug('Starting WebAuthn registration:', publicKeyOptions);

    const attestationResponse = await startRegistration({
        optionsJSON: publicKeyOptions,
    });

    console.debug('WebAuthn registration response:', attestationResponse);

    const verifiedRegistrationResponse = await verifyRegistrationResponse({
        response: attestationResponse,
        expectedChallenge: bufferToBase64URLString(challenge.buffer),
        expectedOrigin: getRpOrigin(),
        expectedRPID: getRpId(),
    });

    if (
        !verifiedRegistrationResponse.verified ||
        !verifiedRegistrationResponse.registrationInfo.userVerified
    ) {
        console.debug(
            'Failed to verify registration response',
            verifiedRegistrationResponse.registrationInfo,
        );
        throw new Error('Failed to verify registration response');
    }

    // @ts-expect-error
    if (!attestationResponse.clientExtensionResults.prf?.enabled) {
        // This shouldn't hanppend if client capabilities has worked as expected but it's better to be safe
        // TODO: remove the credential from the authenticator, it's useless
        console.debug(
            'PRF extension not supported by this authenticator.',
            attestationResponse,
            verifiedRegistrationResponse.registrationInfo,
        );
        throw new Error('PRF extension not supported by this authenticator.');
    }

    console.debug(
        'WebAuthn registration successful:',
        verifiedRegistrationResponse.registrationInfo,
    );

    const { credential } = verifiedRegistrationResponse.registrationInfo;

    return {
        credentialId: credential.id,
        transports: credential.transports ?? [],
        userId: bufferToBase64URLString(userId.buffer),
        publicKey: bufferToBase64URLString(credential.publicKey.buffer),
    };
};

// FIXME: doesn't seem to work, maybe navigator.credentials.get() is required to be called first?
export const removeWebAuthnCredential = async (credentialId: string) => {
    console.debug('Removing WebAuthn credential:', credentialId);
    // TODO: fix TS
    // @ts-expect-error
    await PublicKeyCredential.signalUnknownCredential({
        credentialId,
        rpId: getRpId(),
    });
    console.debug('WebAuthn credential removed:', credentialId);
};

// FIXME: doesn't seem to work
export const removeWebAuthnCrendetials = async (userId: string) => {
    console.debug('Removing WebAuthn credentials for user:', userId);
    // TODO: fix TS
    // @ts-expect-error
    await PublicKeyCredential.signalAllAcceptedCredentials({
        allAcceptedCredentialIds: [],
        rpId: getRpId(),
        userId,
    });
    console.debug('WebAuthn credentials removed for user:', userId);
};

export const getWebAuthnCredentials = async (
    credentials: WebAuthnCredential[],
    prevSalt?: Uint8Array | null,
) => {
    const challenge = new Uint8Array(randomBytes(32));
    const salt = new Uint8Array(prevSalt || randomBytes(32));

    const authenticationOptions = await generateAuthenticationOptions({
        rpID: getRpId(),
        challenge,
        userVerification: 'required',
        timeout: 300_000,
        allowCredentials: credentials.map(cred => ({
            id: cred.credentialId,
            transports: cred.transports as AuthenticatorTransportFuture[],
        })),
        extensions: {
            // @ts-expect-error
            prf: {
                eval: {
                    first: salt,
                },
            },
        },
    });

    console.debug('Starting WebAuthn authentication:', authenticationOptions);

    const assertionResponse = await startAuthentication({
        optionsJSON: authenticationOptions,
    });

    console.debug('WebAuthn authentication response:', assertionResponse);

    // @ts-expect-error
    if (!assertionResponse.clientExtensionResults.prf?.results?.first) {
        console.debug('PRF extension not supported by this authenticator.', assertionResponse);

        throw new Error('PRF extension not supported by this authenticator.');
    }

    const credential = credentials.find(cred => cred.credentialId === assertionResponse.id)!;

    // TODO: handle undefined credential -> the flow when the credential is "discored" from an authenticator but not avail. in local storage

    const verifiedAssertion = await verifyAuthenticationResponse({
        response: assertionResponse,
        expectedChallenge: bufferToBase64URLString(challenge.buffer),
        expectedRPID: getRpId(),
        expectedOrigin: getRpOrigin(),
        credential: {
            id: credential.credentialId,
            publicKey: new Uint8Array(base64URLStringToBuffer(credential.publicKey)),
            transports: credential.transports as AuthenticatorTransportFuture[],
            counter: 0,
        },
        requireUserVerification: true,
    });

    if (!verifiedAssertion.verified || !verifiedAssertion.authenticationInfo.userVerified) {
        console.debug(
            'Failed to verify authentication response',
            verifiedAssertion.authenticationInfo,
        );
        throw new Error('Failed to verify authentication response');
    }

    console.debug('WebAuthn authentication successful:', verifiedAssertion.authenticationInfo);

    // TODO: handle the flow when the credential is "discored" from an authenticator but not avail. in local storage
    // if (!credential) {
    //     return {
    //         credentialId: verifiedAssertion.authenticationInfo.credentialID,

    //         salt: bufferToBase64URLString(salt.buffer),
    //         seed: bufferToBase64URLString(
    //             // @ts-expect-error
    //             assertionResponse.clientExtensionResults.prf?.results?.first,
    //         ),
    //     };
    // }

    return {
        credentialId: credential.credentialId,
        transports: credential.transports as AuthenticatorTransportFuture[],
        userId: credential.userId,
        publicKey: credential.publicKey,
        // TODO: return is always as buffer, do the conversion outside this function (so we can use the buffer directly to avoid double encoding/decoding and allocation)
        salt: bufferToBase64URLString(salt.buffer),
        // @ts-expect-error
        seed: bufferToBase64URLString(assertionResponse.clientExtensionResults.prf?.results?.first),
    };
};
