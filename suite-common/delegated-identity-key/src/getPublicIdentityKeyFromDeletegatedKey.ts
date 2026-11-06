import { type ProofOfDelegatedSignFailedType } from '@suite-common/delegated-identity-key-types';
import { type DelegatedIdentityKey } from '@suite-common/suite-types';
import { type Result, err, ok } from '@trezor/type-utils';

import { ProofOfDelegatedSignFailed } from './getProofOfDelegatedIdentity';

/**
 * Derives the public identity key from the delegated identity key (private key).
 * Returns the public key in hex format (uncompressed).
 */
export const getPublicIdentityKeyFromDelegatedKey = async (
    delegatedKey: DelegatedIdentityKey,
): Promise<Result<string, ProofOfDelegatedSignFailedType>> => {
    try {
        const { p256 } = await import('@noble/curves/nist.js');
        const privateKeyBytes = Buffer.from(delegatedKey, 'hex');
        const publicKeyBytes = p256.getPublicKey(privateKeyBytes, false);

        return ok(Buffer.from(publicKeyBytes).toString('hex'));
    } catch (e) {
        return err(ProofOfDelegatedSignFailed(e));
    }
};
