import { p256 } from '@noble/curves/nist.js';
import { sha256 } from '@noble/hashes/sha2';

import { DelegatedIdentityKey } from '@suite-common/suite-types';
import { ProofOfDelegatedIdentity, asProofOfDelegatedIdentity } from '@trezor/connect';
import { Result, err, ok } from '@trezor/type-utils';
import { bufferUtils } from '@trezor/utils';

/**
 * This may happen in case of data in Redux are corrupted.
 *
 * For example: when we introduced SafeStorage encryption
 * and users (only developers & tested, ATM) have non-encrypted
 * data in Redux, or we change the encryption method.
 */
type ProofOfDelegatedSignFailed = {
    type: 'ProofOfDelegatedSignFailed';
    caused: unknown;
};

const ProofOfDelegatedSignFailed = (caused: any): ProofOfDelegatedSignFailed => ({
    type: 'ProofOfDelegatedSignFailed',
    caused,
});

export type GetProofOfDelegatedIdentityParams = {
    delegatedKey: DelegatedIdentityKey;
    header: string;
};

type GetProofOfDelegatedIdentityResult = Result<
    ProofOfDelegatedIdentity,
    ProofOfDelegatedSignFailed
>;

export const getProofOfDelegatedIdentity = ({
    delegatedKey,
    header,
}: GetProofOfDelegatedIdentityParams): GetProofOfDelegatedIdentityResult => {
    const prefixedMessageInBuffer = Buffer.concat([
        bufferUtils.getChunkSize(header.length),
        Buffer.from(header),
    ]);

    const messageDigest = sha256(prefixedMessageInBuffer);
    const secretKey = Buffer.from(delegatedKey, 'hex');

    try {
        const signature = p256.sign(messageDigest, secretKey, { prehash: false });

        return ok(asProofOfDelegatedIdentity(Buffer.from(signature).toString('hex')));
    } catch (e) {
        return err(ProofOfDelegatedSignFailed(e));
    }
};
