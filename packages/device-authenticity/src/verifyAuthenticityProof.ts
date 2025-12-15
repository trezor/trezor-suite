import { ed25519 } from '@noble/curves/ed25519.js';
import * as crypto from 'crypto';

import { getSubtleCrypto } from '@trezor/crypto-utils';
import { bufferUtils } from '@trezor/utils';

import {
    VerifyAuthenticityProofParams,
    VerifyAuthenticityProofResult,
    VerifySignature,
} from './types';
import { getRootPubKeyBlacklist, getRootPubKeys } from './utils';
import { AlgorithmName, parseCertificate } from './x509certificate';

// There is incomparability in results between nodejs and window SubtleCrypto api.
// window.crypto.subtle.importKey (CryptoKey) cannot be used by `crypto-browserify`.Verify
// The only common format of publicKey is PEM.
export const verifySignatureP256: VerifySignature = async (rawKey, data, signature) => {
    const signer = crypto.createVerify('sha256');
    signer.update(Buffer.from(data));

    const SubtleCrypto = getSubtleCrypto();

    try {
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
    } catch {
        // invalid inputs shall be considered unsuccessful verification, rather than runtime error
        // (e.g. calling this with a P-256 signature and an Ed25519 key)
        return false;
    }
};

// Verifies Ed25519 signature using @noble/curves, because SubtleCrypto Ed25519 is still not broadly supported.
// We can revert to SubtleCrypto when we stop supporting Chromium < 137 https://caniuse.com/mdn-api_subtlecrypto_sign_ed25519
// Also must be verified react-native javascript runtime (unknown support matrix).
const verifySignatureEd25519: VerifySignature = (rawKey, data, signature) => {
    try {
        return ed25519.verify(signature, data, rawKey);
    } catch {
        // invalid inputs shall be considered unsuccessful verification, rather than runtime error
        // @noble/hashes correctly returns false when calling this with an Ed25519 signature and a P-256 key, but malformed signature sometimes throws
        return false;
    }
};

const getVerifyFn = (algorithmName: AlgorithmName): VerifySignature => {
    if (algorithmName === 'P-256') return verifySignatureP256;
    if (algorithmName === 'Ed25519') return verifySignatureEd25519;
    throw new Error(`Unsupported signature algorithm.`);
};

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
    challenge,
    certificates,
    signature,
    deviceModel,
    allowDebugKeys,
    config,
    blacklistConfig,
    challengePrefix = 'AuthenticateDevice:',
    bufferChunks = [],
}: VerifyAuthenticityProofParams): Promise<VerifyAuthenticityProofResult> => {
    // Parse config with given device model, type of secure element and debug mode.
    const allRootPubKeys = getRootPubKeys({
        config,
        deviceModel,
        allowDebugKeys,
    });
    const rootPubKeyBlacklist = getRootPubKeyBlacklist({
        blacklistConfig,
        allowDebugKeys,
    });

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
    const deviceCertAlgName = deviceCert.signatureAlgorithm.algorithmName;
    const caCertAlgName = caCert.signatureAlgorithm.algorithmName;
    if (deviceCertAlgName !== caCertAlgName) {
        throw new Error('Mismatched signature algorithms in device and CA certificates');
    }
    const verifySignatureFn = getVerifyFn(deviceCertAlgName);

    // 2. validate that CA certificate was created using one of rootPubkeys
    const caPubKey = Buffer.from(caCert.tbsCertificate.subjectPublicKeyInfo.bits.bytes).toString(
        'hex',
    );

    const isCertSignedByRootPubkey = await Promise.all(
        allRootPubKeys.map(rootPubKey =>
            verifySignatureFn(
                Buffer.from(rootPubKey, 'hex'),
                caCert.tbsCertificate.asn1.raw,
                caCert.signatureValue.bits.bytes,
            ),
        ),
    );

    const rootPubKeyIndex = isCertSignedByRootPubkey.findIndex(valid => !!valid);
    //TS evaluates string[][number] as string, but it can also be undefined (when index is -1)
    const rootPubKeyMatch: string | undefined = allRootPubKeys[rootPubKeyIndex];
    const caCertValidityFrom = caCert.tbsCertificate.validity.from.getTime();

    if (caCertValidityFrom > new Date().getTime()) {
        throw new Error(`CA validity from ${caCertValidityFrom} can't be in the future!`);
    }

    if (rootPubKeyMatch === undefined) {
        return {
            valid: false,
            caPubKey,
            error: 'ROOT_PUBKEY_NOT_FOUND',
        };
    }

    // 3. validate DEVICE certificate subject (Trezor features internal_model)
    const [subject] = deviceCert.tbsCertificate.subject;
    // subject algorithm (OID) https://www.alvestrand.no/objectid/2.5.4.3.html
    if (!subject.parameters || subject.algorithmOid !== '2.5.4.3') {
        throw new Error('Missing certificate subject');
    }
    // slice 4 bytes from the subject (internal model)
    const subjectValue = Buffer.from(subject.parameters.asn1.contents.subarray(0, 4)).toString();
    if (subjectValue !== deviceModel) {
        return {
            valid: false,
            caPubKey,
            rootPubKey: rootPubKeyMatch,
            error: 'INVALID_DEVICE_MODEL',
        };
    }

    // 4. validate that DEVICE certificate was created using pubKey from CA certificate
    const isDeviceCertValid = await verifySignatureFn(
        Buffer.from(caCert.tbsCertificate.subjectPublicKeyInfo.bits.bytes),
        deviceCert.tbsCertificate.asn1.raw,
        deviceCert.signatureValue.bits.bytes,
    );

    // 5. validate that the signature from AuthenticityProof was created using prefixed challenge **and** if DEVICES pubKey is not on blacklist
    const challengePrefixBuffer = Buffer.from(challengePrefix);

    const chunks =
        bufferChunks && bufferChunks.length > 0
            ? [challengePrefixBuffer, ...bufferChunks]
            : [challengePrefixBuffer, challenge];

    const prefixedBuffer = Buffer.concat(
        chunks.flatMap(chunk => [bufferUtils.getChunkSize(chunk.byteLength), chunk]),
    );

    const isSignatureValid = await verifySignatureFn(
        Buffer.from(deviceCert.tbsCertificate.subjectPublicKeyInfo.bits.bytes),
        prefixedBuffer,
        Buffer.from(signature, 'hex'),
    );

    if (isDeviceCertValid && isSignatureValid) {
        if (rootPubKeyBlacklist.includes(caPubKey)) {
            return {
                valid: false,
                caPubKey,
                rootPubKey: rootPubKeyMatch,
                error: 'CA_PUBKEY_BLACKLISTED',
            };
        }

        return {
            valid: true,
            caPubKey,
            rootPubKey: rootPubKeyMatch,
        };
    }

    if (!isDeviceCertValid) {
        return {
            valid: false,
            caPubKey,
            rootPubKey: rootPubKeyMatch,
            error: 'INVALID_DEVICE_CERTIFICATE',
        };
    }

    return {
        valid: false,
        caPubKey,
        rootPubKey: rootPubKeyMatch,
        error: 'INVALID_DEVICE_SIGNATURE',
    };
};
