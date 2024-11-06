import * as crypto from 'crypto';

import { bufferUtils } from '@trezor/utils';

import { PROTO } from '../../constants';
import { AuthenticateDeviceResult } from '../../types/api/authenticateDevice';
import { parseCertificate, fixSignature } from './x509certificate';
import { DeviceAuthenticityConfig } from '../../data/deviceAuthenticityConfigTypes';

// There is incomparability in results between nodejs and window SubtleCrypto api.
// window.crypto.subtle.importKey (CryptoKey) cannot be used by `crypto-browserify`.Verify
// The only common format of publicKey is PEM.
const verifySignature = async (rawKey: Buffer, data: Uint8Array, signature: Uint8Array) => {
    const signer = crypto.createVerify('sha256');
    signer.update(Buffer.from(data));

    // use native SubtleCrypto api.
    // Unfortunately `crypto-browserify`.subtle polyfill is missing so needs to be referenced directly from window object (if exists)
    // https://github.com/browserify/crypto-browserify/issues/221
    const SubtleCrypto = typeof window !== 'undefined' ? window.crypto.subtle : crypto.subtle;
    if (!SubtleCrypto) {
        throw new Error('SubtleCrypto not supported');
    }

    // get ECDSA P-256 (secp256r1) key from RAW key
    const ecPubKey = await SubtleCrypto.importKey(
        'raw',
        rawKey,
        { name: 'ECDSA', namedCurve: 'P-256' },
        true,
        ['verify'],
    );

    // export ECDSA key as spki
    const spkiPubKey = await SubtleCrypto.exportKey('spki', ecPubKey);

    // create PEM from spki
    const key = `-----BEGIN PUBLIC KEY-----\n${Buffer.from(spkiPubKey).toString(
        'base64',
    )}\n-----END PUBLIC KEY-----`;

    // verify using PEM key
    return signer.verify({ key }, Buffer.from(signature));
};

interface AuthenticityProofData extends PROTO.AuthenticityProof {
    challenge: Buffer;
    config: DeviceAuthenticityConfig;
    allowDebugKeys?: boolean;
    deviceModel: keyof typeof PROTO.DeviceModelInternal; // Device.features.internal_model
}

export const getRandomChallenge = () => crypto.randomBytes(32);

// Check that this certificate is a valid Trezor CA.
// KeyUsage must be present and allow certificate signing.
// BasicConstraints must be present, have the cA flag and a pathLenConstraint.
// Any unrecognized non-critical extension is allowed. Any unrecognized critical extension is disallowed.
const validateCaCertExtensions = (cert: ReturnType<typeof parseCertificate>, pathLen: number) => {
    let hasKeyUsage,
        hasBasicConstraints = false;
    cert.tbsCertificate.extensions.forEach(ext => {
        if (ext.key === 'keyUsage') {
            if (ext.keyCertSign !== '1') {
                throw new Error(`CA keyCertSign not set`);
            }
            hasKeyUsage = true;
        } else if (ext.key === 'basicConstraints') {
            if (!ext.cA) {
                throw new Error(`CA basicConstraints.cA not set`);
            }
            if (typeof ext.pathLenConstraint != 'number') {
                throw new Error('CA basicConstraints.pathLenConstraint not set');
            }
            if (ext.pathLenConstraint < pathLen) {
                throw new Error('Issuer was not permitted to issue certificate');
            }
            hasBasicConstraints = true;
        } else if (ext.critical) {
            throw new Error(`Unknown critical extension ${ext.key} in CA certificate`);
        }
    });

    if (!hasKeyUsage || !hasBasicConstraints) {
        throw new Error(
            `CA missing extensions keyUsage: ${hasKeyUsage}, basicConstraints: ${hasBasicConstraints}`,
        );
    }
};

export const verifyAuthenticityProof = async ({
    certificates,
    signature,
    challenge,
    config,
    allowDebugKeys,
    deviceModel,
}: AuthenticityProofData): Promise<AuthenticateDeviceResult> => {
    const modelConfig = config[deviceModel];
    if (!modelConfig) {
        throw new Error(`Pubkeys for ${deviceModel} not found in config`);
    }
    const { caPubKeys, debug } = modelConfig;

    // 1. parse all x509 certificates received from AuthenticityProof
    const [deviceCert, caCert] = certificates.map((c, i) => {
        const cert = parseCertificate(new Uint8Array(Buffer.from(c, 'hex')));
        if (i === 0) {
            // deviceCert is always at index 0
            return cert;
        }
        validateCaCertExtensions(cert, i - 1);

        return cert;
    });

    // 2. validate that CA certificate was created using one of rootPubkeys
    const caPubKey = Buffer.from(caCert.tbsCertificate.subjectPublicKeyInfo.bits.bytes).toString(
        'hex',
    );
    const rootPubKeys = allowDebugKeys
        ? modelConfig.rootPubKeys.concat(debug?.rootPubKeys || [])
        : modelConfig.rootPubKeys;

    const isCertSignedByRootPubkey = await Promise.all(
        rootPubKeys.map(rootPubKey =>
            verifySignature(
                Buffer.from(rootPubKey, 'hex'),
                caCert.tbsCertificate.asn1.raw,
                caCert.signatureValue.bits.bytes,
            ),
        ),
    );

    const rootPubKeyIndex = isCertSignedByRootPubkey.findIndex(valid => !!valid);
    const rootPubKey = rootPubKeys[rootPubKeyIndex];
    const isDebugRootPubKey = debug?.rootPubKeys.includes(rootPubKey);
    const caCertValidityFrom = caCert.tbsCertificate.validity.from.getTime();

    if (caCertValidityFrom > new Date().getTime()) {
        throw new Error(`CA validity from ${caCertValidityFrom} cant't be in the future!`);
    }

    if (!rootPubKey) {
        const configExpired = new Date(config.timestamp).getTime() < caCertValidityFrom;

        return {
            valid: false,
            configExpired,
            caPubKey,
            error: 'ROOT_PUBKEY_NOT_FOUND',
        };
    }

    // 3. validate DEVICE certificate subject (Trezor features internal_model)
    const [subject] = deviceCert.tbsCertificate.subject;
    // subject algorithm (OID) https://www.alvestrand.no/objectid/2.5.4.3.html
    if (!subject.parameters || subject.algorithm !== '2.5.4.3') {
        throw new Error('Missing certificate subject');
    }
    // slice 4 bytes from the subject (internal model)
    const subjectValue = Buffer.from(subject.parameters.asn1.contents.subarray(0, 4)).toString();
    if (subjectValue !== deviceModel) {
        return {
            valid: false,
            caPubKey,
            error: 'INVALID_DEVICE_MODEL',
        };
    }

    // 4. validate that DEVICE certificate was created using pubKey from CA certificate
    const isDeviceCertValid = await verifySignature(
        Buffer.from(caCert.tbsCertificate.subjectPublicKeyInfo.bits.bytes),
        deviceCert.tbsCertificate.asn1.raw,
        deviceCert.signatureValue.bits.bytes,
    );

    // 5. validate that the signature from AuthenticityProof was created using prefixed challenge **and** DEVICE certificate pubKey
    const challengePrefix = Buffer.from('AuthenticateDevice:');
    const prefixedChallenge = Buffer.concat([
        bufferUtils.getChunkSize(challengePrefix.length),
        challengePrefix,
        bufferUtils.getChunkSize(challenge.length),
        challenge,
    ]);
    const isSignatureValid = await verifySignature(
        Buffer.from(deviceCert.tbsCertificate.subjectPublicKeyInfo.bits.bytes),
        prefixedChallenge,
        fixSignature(Buffer.from(signature, 'hex')),
    );

    if (rootPubKey && isDeviceCertValid && isSignatureValid) {
        if (
            (!isDebugRootPubKey && !caPubKeys.includes(caPubKey)) ||
            (isDebugRootPubKey && !debug?.caPubKeys.includes(caPubKey))
        ) {
            const configExpired = new Date(config.timestamp).getTime() < caCertValidityFrom;

            return {
                valid: false,
                configExpired,
                caPubKey,
                error: 'CA_PUBKEY_NOT_FOUND',
            };
        }

        return {
            valid: true,
            caPubKey,
            debugKey: isDebugRootPubKey,
        };
    }

    if (!isDeviceCertValid) {
        return {
            valid: false,
            caPubKey,
            error: 'INVALID_DEVICE_CERTIFICATE',
        };
    }

    return {
        valid: false,
        caPubKey,
        error: 'INVALID_DEVICE_SIGNATURE',
    };
};
