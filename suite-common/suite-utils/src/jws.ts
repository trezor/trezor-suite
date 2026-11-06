import type { Algorithm } from 'jws';

import { getJWSPublicKey } from '@trezor/env-utils';

const authenticityPublicKey = getJWSPublicKey();

/**
 * The JWS library loads on demand, so it stays out of the initial bundle.
 * Await this alongside other work to have it downloaded by the time a config is decoded or verified.
 */
export const preloadJws = async () => {
    await import('jws');
};

export const verifyJws = async (jws: string, algorithm: Algorithm) => {
    if (!authenticityPublicKey) {
        throw Error('JWS public key is not defined!');
    }

    const { verify } = await import('jws');

    return verify(jws, algorithm, authenticityPublicKey);
};

export const decodeJws = async (jws: string) => {
    const { decode } = await import('jws');

    return decode(jws);
};
