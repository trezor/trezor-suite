import { p256 } from '@noble/curves/nist.js';

import { type DelegatedIdentityKey } from '@suite-common/suite-types';

/**
 * Derives the public identity key from the delegated identity key (private key).
 * Returns the public key in hex format (uncompressed).
 */
export const getPublicIdentityKeyFromDelegatedKey = (
    delegatedKey: DelegatedIdentityKey,
): string => {
    const privateKeyBytes = Buffer.from(delegatedKey, 'hex');
    const publicKeyBytes = p256.getPublicKey(privateKeyBytes, false);

    return Buffer.from(publicKeyBytes).toString('hex');
};
