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

/**
 * Parses certificate, matches them against known root public keys, and verifies the signature over the prepared data.
 * P-256 and Ed25519 algorithms are supported and automatically detected from the certificate.
 */
export const verifyAuthenticityProof = async ({
    certificates,
    signature,
    data,
    deviceModel,
    allowDebugKeys,
    config,
    blacklistConfig,
}: VerifyAuthenticityProofParams): Promise<VerifyAuthenticityProofResult> => {
    // Parse config with given device model, type of secure element and debug mode.
    const allRootPubKeys = getRootPubKeys({
        config,
        deviceModel,
        allowDebugKeys,
    });
    const caPubKeyBlacklist = getCaPubKeyBlacklist({
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

    // 5. validate that the signature from AuthenticityProof was created using prefixed challenge
    const isSignatureValid = await verifySignatureFn(
        Buffer.from(deviceCert.tbsCertificate.subjectPublicKeyInfo.bits.bytes),
        data,
        Buffer.from(signature, 'hex'),
    );

    // 6. checks if DEVICES pubKey is not on blacklist
    if (isDeviceCertValid && isSignatureValid) {
        if (caPubKeyBlacklist.includes(caPubKey)) {
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
