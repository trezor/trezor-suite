import * as crypto from 'crypto';
import { bufferUtils } from '@trezor/utils';

import { PROTO } from '../../constants';
import { DeviceAuthenticityConfig } from '../../data/deviceAuthenticityConfig';
import { AuthenticateDeviceResult } from '../../types/api/authenticateDevice';
import { parseCertificate, fixSignature } from './x509certificate';

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

    // 1. parse x509 CA certificate from AuthenticityProof
    const caCert = parseCertificate(new Uint8Array(Buffer.from(certificates[1], 'hex')));
    const caPubKey = Buffer.from(caCert.tbsCertificate.subjectPublicKeyInfo.bits.bytes).toString(
        'hex',
    );

    // 2. parse x509 DEVICE certificate from AuthenticityProof
    const deviceCert = parseCertificate(new Uint8Array(Buffer.from(certificates[0], 'hex')));

    // 3. validate that CA certificate was created using one of rootPubkeys
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

    // 4. validate DEVICE certificate subject (Trezor features internal_model)
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

    // 5. validate that DEVICE certificate was created using pubKey from CA certificate
    const isDeviceCertValid = await verifySignature(
        Buffer.from(caCert.tbsCertificate.subjectPublicKeyInfo.bits.bytes),
        deviceCert.tbsCertificate.asn1.raw,
        deviceCert.signatureValue.bits.bytes,
    );

    // 6. validate that the signature from AuthenticityProof was created using prefixed challenge **and** DEVICE certificate pubKey
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
