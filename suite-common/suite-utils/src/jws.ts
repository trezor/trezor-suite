import { type Algorithm, createVerify, decode } from 'jws';

import { getJWSPublicKey } from '@trezor/env-utils';

/**
 * The public key defaults to the one matching the current build flavour. Pass it explicitly for data
 * that is published from a single location and therefore always signed by the same key.
 */
export const verifyJws = (jws: string, algorithm: Algorithm, publicKey = getJWSPublicKey()) =>
    new Promise<boolean>((resolve, reject) => {
        if (!publicKey) {
            throw Error('JWS public key is not defined!');
        }

        try {
            const verifier = createVerify({
                algorithm,
                publicKey,
                signature: jws,
            });
            verifier.on('done', (valid: boolean) => resolve(valid));
            verifier.on('error', reject);
        } catch (e) {
            reject(e);
        }
    });

export const decodeJws = decode;
