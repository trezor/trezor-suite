import { ed25519 } from '@noble/curves/ed25519.js';
import crypto from 'crypto';

import { getSubtleCrypto } from '@trezor/crypto-utils';
import { bufferUtils } from '@trezor/utils';

import { type VerifySignature } from './types';
import { type AlgorithmName, fixSignature } from './x509certificate';

// There is incomparability in results between Node.js and window SubtleCrypto api.
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
            bufferUtils.toNonSharedBuffer(rawKey),
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
        return signer.verify({ key }, fixSignature(signature));
    } catch {
        // invalid inputs shall be considered unsuccessful verification, rather than runtime error
        // (e.g. calling this with a P-256 signature and an Ed25519 key)
        return false;
    }
};

// Verifies Ed25519 signature using @noble/curves, because SubtleCrypto Ed25519 is still not broadly supported.
// We can revert to SubtleCrypto when we stop supporting Chromium < 137 https://caniuse.com/mdn-api_subtlecrypto_sign_ed25519
// Also must be verified react-native JavaScript runtime (unknown support matrix).
export const verifySignatureEd25519: VerifySignature = (rawKey, data, signature) => {
    try {
        return ed25519.verify(signature, data, rawKey);
    } catch {
        // invalid inputs shall be considered unsuccessful verification, rather than runtime error
        // @noble/hashes correctly returns false when calling this with an Ed25519 signature and a P-256 key, but malformed signature sometimes throws
        return false;
    }
};

export const getVerifyFn = (algorithmName: AlgorithmName): VerifySignature => {
    if (algorithmName === 'P-256') return verifySignatureP256;
    if (algorithmName === 'Ed25519') return verifySignatureEd25519;
    throw new Error(`Unsupported signature algorithm.`);
};
