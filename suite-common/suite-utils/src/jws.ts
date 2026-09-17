import { type Algorithm, decode, verify } from 'jws';

import { getJWSPublicKey } from '@trezor/env-utils';

const authenticityPublicKey = getJWSPublicKey();

export const verifyJws = (jws: string, algorithm: Algorithm) => {
    if (!authenticityPublicKey) {
        throw Error('JWS public key is not defined!');
    }

    return verify(jws, algorithm, authenticityPublicKey);
};

export const decodeJws = decode;
