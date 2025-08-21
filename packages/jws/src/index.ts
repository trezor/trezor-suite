import * as jose from 'jose';

import { isCodesignBuild } from '@trezor/env-utils';

import { firmwareConfigPublicKey, mainPublicKey } from './pubkeys';
import { JWSPublicKeyUse } from './types';

const getJWSPublicKey = (use: JWSPublicKeyUse, useCodeSignKey = false) => {
    if (['message-system', 'token-definitions'].includes(use)) {
        return isCodesignBuild() || useCodeSignKey ? mainPublicKey.codesign : mainPublicKey.dev;
    }

    return isCodesignBuild() || useCodeSignKey
        ? firmwareConfigPublicKey.codesign
        : firmwareConfigPublicKey.dev;
};

/**
 * decodeJwsPayload - decodes the payload of a JWS
 * @param jws the JWS to decode
 * @returns the decoded payload
 */
export const decodeJwsPayload = (jws: string): any => jose.decodeJwt(jws);

/**
 * verifyJwsSignature - throws if the JWS signature is invalid, returns payload if valid
 * @param jws input data
 * @param use which type of JWS key to use
 * @param useCodeSignKey whether to use the code signing key
 * @param signAlgorithm the signing algorithm used
 */
export const decodeVerifyJwsSignature = async (
    jws: string,
    use: JWSPublicKeyUse,
    useCodeSignKey = false,
    signAlgorithm = 'ES256',
): Promise<any> => {
    const publicKey = getJWSPublicKey(use, useCodeSignKey);

    const josePublicKey = await jose.importSPKI(publicKey, signAlgorithm);
    //const josePublicKey = await jose.importJWK(publicKey, signAlgorithm);
    const decoded = await jose.compactVerify(jws, josePublicKey, { algorithms: [signAlgorithm] });
    if (!decoded || !decoded.payload) {
        throw new Error('Failed to decode JWS or payload is missing.');
    }

    return decoded.payload;
};
