import { decode, verify } from '@pagopa/io-react-native-jwt';

import { isCodesignBuild } from '@trezor/env-utils';

import { firmwareConfigPublicKey, mainPublicKey } from './pubkeys-jwk';
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
export const decodeJwsPayload = (jws: string): any => {
    const decoded = decode(jws);
    if (!decoded || !decoded.payload) {
        throw new Error('Failed to decode JWS or payload is missing.');
    }

    return decoded.payload;
};

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
): Promise<any> => {
    const publicKey = getJWSPublicKey(use, useCodeSignKey);

    const decoded = await verify(jws, publicKey);

    return decoded.payload;
};
