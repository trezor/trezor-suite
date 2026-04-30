import { bufferUtils } from '@trezor/utils';

import {
    type PrepareDeviceAuthenticityDataParams,
    type VerifyAuthenticityProofParams,
    type VerifyAuthenticityProofResult,
} from './types';
import { getCaPubKeyBlacklist, getRootPubKeys } from './utils';
import { validateCaCertExtensions } from './validateCaCertExtensions';
import { getVerifyFn } from './verifySignatures';
import { parseCertificate } from './x509certificate';

// Compose the data against which the signatures will be verified.
export const prepareDeviceAuthenticityData = ({
    payload,
    prefix = 'AuthenticateDevice:',
}: PrepareDeviceAuthenticityDataParams): Uint8Array => {
    const prefixBuffer = Buffer.from(prefix);
    const payloadArray = Array.isArray(payload) ? payload : [payload];
    const chunks = [prefixBuffer, ...payloadArray];

    return Buffer.concat(
        chunks.flatMap(chunk => [bufferUtils.getChunkSize(chunk.byteLength), chunk]),
    );
};

type ParsedCertificate = ReturnType<typeof parseCertificate>;

type MatchRootPubKeyToCertificateParams = {
    cert: ParsedCertificate;
    allRootPubKeys: string[];
};
/**
 * Finds a root public key that can verify the signature of the provided certificate.
 */
export const matchRootPubKeyToCertificate = async ({
    cert,
    allRootPubKeys,
}: MatchRootPubKeyToCertificateParams): Promise<string | undefined> => {
    const verifySignatureFn = getVerifyFn(cert.signatureAlgorithm.algorithmName);
    const isCertSignedByRootPubkey = await Promise.all(
        allRootPubKeys.map(rootPubKey =>
            verifySignatureFn(
                Buffer.from(rootPubKey, 'hex'),
                cert.tbsCertificate.asn1.raw,
                cert.signatureValue.bits.bytes,
            ),
        ),
    );

    const rootPubKeyIndex = isCertSignedByRootPubkey.findIndex(valid => !!valid);

    return allRootPubKeys[rootPubKeyIndex];
};

/**
 * Validates DEVICE certificate subject (Trezor features internal_model) and return the model
 */
const parseModelFromDeviceCertSubject = (deviceCert: ParsedCertificate) => {
    const [subject] = deviceCert.tbsCertificate.subject;
    // subject algorithm (OID) https://www.alvestrand.no/objectid/2.5.4.3.html
    if (!subject.parameters || subject.algorithmOid !== '2.5.4.3') {
        throw new Error('Missing certificate subject');
    }

    // slice 4 bytes from the subject (internal model)
    return Buffer.from(subject.parameters.asn1.contents.subarray(0, 4)).toString();
};

type VerifyDeviceAndCACertificatesParams = {
    deviceCert: ParsedCertificate;
    caCert: ParsedCertificate;
    allRootPubKeys: string[];
    caPubKeyBlacklist: string[];
} & Pick<VerifyAuthenticityProofParams, 'deviceModel' | 'signedData' | 'signature'>;
/**
 * Given a device certificate and CA certificate, it verifies the following signing scheme:
 * rootPubKey (matched from list of possible keys) → CA pub key → device key → supplied signature of prefixed challenge.
 * Additional validation is done on the certificates payload.
 */
const verifyDeviceAndCACertificates = async ({
    deviceCert,
    caCert,
    signature,
    signedData,
    deviceModel,
    allRootPubKeys,
    caPubKeyBlacklist,
}: VerifyDeviceAndCACertificatesParams): Promise<VerifyAuthenticityProofResult> => {
    validateCaCertExtensions(caCert, 0); // pathLenConstraint is always 0 (we don't expect a chain of multiple CA certs)
    const deviceCertAlgName = deviceCert.signatureAlgorithm.algorithmName;
    const caCertAlgName = caCert.signatureAlgorithm.algorithmName;
    if (deviceCertAlgName !== caCertAlgName) {
        throw new Error('Mismatched signature algorithms in device and CA certificates');
    }
    const verifySignatureFn = getVerifyFn(deviceCertAlgName);

    // Validate that CA certificate was created using one of rootPubkeys
    const caPubKeyBytes = caCert.tbsCertificate.subjectPublicKeyInfo.bits.bytes;
    const caPubKey = Buffer.from(caPubKeyBytes).toString('hex');

    const rootPubKeyMatch = await matchRootPubKeyToCertificate({ allRootPubKeys, cert: caCert });
    if (rootPubKeyMatch === undefined) {
        return { valid: false, caPubKey, error: 'ROOT_PUBKEY_NOT_FOUND' };
    }
    // Check if this specific CA pubKey is not on the blacklist
    if (caPubKeyBlacklist.includes(caPubKey)) {
        return {
            valid: false,
            caPubKey,
            rootPubKey: rootPubKeyMatch,
            error: 'CA_PUBKEY_BLACKLISTED',
        };
    }

    const caCertValidityFrom = caCert.tbsCertificate.validity.from.getTime();
    if (caCertValidityFrom > new Date().getTime()) {
        throw new Error(`CA validity from ${caCertValidityFrom} can't be in the future!`);
    }
    const modelFromSubject = parseModelFromDeviceCertSubject(deviceCert);
    if (modelFromSubject !== deviceModel) {
        return {
            valid: false,
            caPubKey,
            rootPubKey: rootPubKeyMatch,
            error: 'INVALID_DEVICE_MODEL',
        };
    }

    // Validate that DEVICE certificate was created using the pubKey from CA certificate
    const isDeviceCertValid = await verifySignatureFn(
        Buffer.from(caPubKeyBytes),
        deviceCert.tbsCertificate.asn1.raw,
        deviceCert.signatureValue.bits.bytes,
    );
    if (!isDeviceCertValid) {
        return {
            valid: false,
            caPubKey,
            rootPubKey: rootPubKeyMatch,
            error: 'INVALID_DEVICE_CERTIFICATE',
        };
    }

    // Validate that the signature from AuthenticityProof was created using prefixed challenge
    const deviceCertBytes = deviceCert.tbsCertificate.subjectPublicKeyInfo.bits.bytes;
    const isSignatureValid = await verifySignatureFn(
        Buffer.from(deviceCertBytes),
        signedData,
        Buffer.from(signature, 'hex'),
    );
    if (isSignatureValid) {
        return { valid: true, caPubKey, rootPubKey: rootPubKeyMatch };
    }

    return {
        valid: false,
        caPubKey,
        rootPubKey: rootPubKeyMatch,
        error: 'INVALID_DEVICE_SIGNATURE',
    };
};

type VerifyOnlyDeviceCertificateParams = {
    deviceCert: ParsedCertificate;
    allRootPubKeys: string[];
} & Pick<VerifyAuthenticityProofParams, 'deviceModel' | 'signedData' | 'signature'>;
/**
 * Given only a device certificate, it verifies the following signing scheme:
 * rootPubKey (matched from list of possible keys) → device key → supplied signature of prefixed challenge.
 * Additional validation is done on the device certificate payload.
 */
const verifyOnlyDeviceCertificate = async ({
    deviceCert,
    signature,
    signedData,
    deviceModel,
    allRootPubKeys,
}: VerifyOnlyDeviceCertificateParams): Promise<VerifyAuthenticityProofResult> => {
    const deviceCertAlgName = deviceCert.signatureAlgorithm.algorithmName;
    const verifySignatureFn = getVerifyFn(deviceCertAlgName);

    const rootPubKeyMatch = await matchRootPubKeyToCertificate({
        allRootPubKeys,
        cert: deviceCert,
    });
    // In this case, deviceCert should be signed with a rootPubKey, so ROOT_PUBKEY_NOT_FOUND has
    // the same meaning as INVALID_DEVICE_CERTIFICATE for `verifyDeviceAndCACertificates`.
    if (rootPubKeyMatch === undefined) {
        return { valid: false, error: 'ROOT_PUBKEY_NOT_FOUND' };
    }
    const modelFromSubject = parseModelFromDeviceCertSubject(deviceCert);
    if (modelFromSubject !== deviceModel) {
        // This path is practically unreachable because here it's the deviceCert that is signed with rootPubKey, so
        // tampering that certificate part invalidates the rootPubKey signature → 'ROOT_PUBKEY_NOT_FOUND' was already thrown.
        return {
            valid: false,
            rootPubKey: rootPubKeyMatch,
            error: 'INVALID_DEVICE_MODEL',
        };
    }

    // Validate that the signature from AuthenticityProof was created using prefixed challenge
    const deviceCertBytes = deviceCert.tbsCertificate.subjectPublicKeyInfo.bits.bytes;
    const isSignatureValid = await verifySignatureFn(
        Buffer.from(deviceCertBytes),
        signedData,
        Buffer.from(signature, 'hex'),
    );
    if (isSignatureValid) {
        return { valid: true, rootPubKey: rootPubKeyMatch };
    }

    return {
        valid: false,
        rootPubKey: rootPubKeyMatch,
        error: 'INVALID_DEVICE_SIGNATURE',
    };
};

/**
 * Parses certificate, matches them against known root public keys, and verifies the signature over the prepared data.
 * P-256, Ed25519, and ML-DSA-44 algorithms are supported and automatically detected from the certificate.
 * Certificates are expected to be either:
 * - [device, CA] signed by P-256 or Ed25519
 * - [device] signed by ML-DSA-44
 * Following signing schemes are verified:
 * - With CA certificate: rootPubKey → CA pub key → device key → prefixed challenge
 * - Without CA certificate: rootPubKey → device key → prefixed challenge
 *
 * Reference implementation in firmware repo (trezorctl):
 * https://github.com/trezor/trezor-firmware/blob/3e0a170eabbd719da7155b754e30139c24a30f17/python/src/trezorlib/authentication.py
 */
export const verifyAuthenticityProof = async ({
    certificates,
    signature,
    signedData,
    deviceModel,
    allowDebugKeys,
    config,
    blacklistConfig,
}: VerifyAuthenticityProofParams): Promise<VerifyAuthenticityProofResult> => {
    // Parse config with given device model, type of secure element and debug mode.
    const allRootPubKeys = getRootPubKeys({ config, deviceModel, allowDebugKeys });
    const caPubKeyBlacklist = getCaPubKeyBlacklist({ blacklistConfig, allowDebugKeys });

    // Parse all x509 certificates received from AuthenticityProof
    const parsedCertificates = certificates.map(c =>
        parseCertificate(new Uint8Array(Buffer.from(c, 'hex'))),
    );
    // For both signing schemes, the 1st certificate is the one expected to be signed by rootPubKey (checked by matchRootPubKeyToCertificate)
    const firstCertAlgName = parsedCertificates[0].signatureAlgorithm.algorithmName;

    if (firstCertAlgName === 'MLDSA44') {
        if (parsedCertificates.length !== 1) {
            return { valid: false, error: 'RESPONSE_MALFORMED' };
        }
        const [deviceCert] = parsedCertificates;

        return await verifyOnlyDeviceCertificate({
            deviceCert,
            signature,
            signedData,
            deviceModel,
            allRootPubKeys,
        });
    }
    if (firstCertAlgName === 'Ed25519' || firstCertAlgName === 'P-256') {
        if (parsedCertificates.length !== 2) {
            return { valid: false, error: 'RESPONSE_MALFORMED' };
        }
        const [deviceCert, caCert] = parsedCertificates;

        return await verifyDeviceAndCACertificates({
            deviceCert,
            caCert,
            signature,
            signedData,
            deviceModel,
            allRootPubKeys,
            caPubKeyBlacklist,
        });
    }

    return { valid: false, error: 'RESPONSE_MALFORMED' }; // unknown signature
};
