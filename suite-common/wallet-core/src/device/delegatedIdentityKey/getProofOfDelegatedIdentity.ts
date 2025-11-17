import { p256 } from '@noble/curves/nist';
import { sha256 } from '@noble/hashes/sha2';

import { DelegatedIdentityKey } from '@suite-common/suite-types';
import { ProofOfDelegatedIdentity, asProofOfDelegatedIdentity } from '@trezor/connect';
import { bufferUtils } from '@trezor/utils';

export type GetProofOfDelegatedIdentityParams = {
    delegatedKey: DelegatedIdentityKey;
    header: string;
};

export const getProofOfDelegatedIdentity = ({
    delegatedKey,
    header,
}: GetProofOfDelegatedIdentityParams): ProofOfDelegatedIdentity => {
    const prefixedMessageInBuffer = Buffer.concat([
        bufferUtils.getChunkSize(header.length),
        Buffer.from(header),
    ]);

    const messageDigest = sha256(prefixedMessageInBuffer);
    const signature = p256.sign(messageDigest, delegatedKey);

    return asProofOfDelegatedIdentity(
        Buffer.from(signature.toBytes('compact').buffer).toString('hex'),
    );
};
