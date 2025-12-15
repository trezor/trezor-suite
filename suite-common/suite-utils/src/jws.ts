import { type Algorithm, createVerify, decode } from 'jws';

import { getJWSPublicKey } from '@trezor/env-utils';

const authenticityPublicKey = getJWSPublicKey();

export const verifyJws = (jws: string, algorithm: Algorithm) =>
    new Promise<boolean>((resolve, reject) => {
        if (!authenticityPublicKey) {
            throw Error('JWS public key is not defined!');
        }

        try {
            const verifier = createVerify({
                algorithm,
                publicKey: authenticityPublicKey,
                signature: jws,
            });
            verifier.on('done', (valid: boolean) => resolve(valid));
            verifier.on('error', reject);
        } catch (e) {
            reject(e);
        }
    });

export const decodeJws = decode;
