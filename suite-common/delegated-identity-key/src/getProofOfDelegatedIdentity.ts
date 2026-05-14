import { p256 } from '@noble/curves/nist.js';

import { type ProofOfDelegatedSignFailedType } from '@suite-common/delegated-identity-key-types';
import { type DelegatedIdentityKey } from '@suite-common/suite-types';
import { type ProofOfDelegatedIdentity, asProofOfDelegatedIdentity } from '@trezor/connect';
import { type Result, err, ok } from '@trezor/type-utils';
import { bufferUtils } from '@trezor/utils';

export const ProofOfDelegatedSignFailed = (caused: any): ProofOfDelegatedSignFailedType => ({
    type: 'ProofOfDelegatedSignFailed',
    caused,
});

export type GetProofOfDelegatedIdentityParams = {
    delegatedKey: DelegatedIdentityKey;
    header: string;
    appendMessageBuffer?: Buffer;
};

type GetProofOfDelegatedIdentityResult = Result<
    ProofOfDelegatedIdentity,
    ProofOfDelegatedSignFailedType
>;

export const getProofOfDelegatedIdentity = ({
    delegatedKey,
    header,
    appendMessageBuffer: buffer,
}: GetProofOfDelegatedIdentityParams): GetProofOfDelegatedIdentityResult => {
    const prefixedMessageInBuffer = Buffer.concat([
        bufferUtils.getChunkSize(header.length),
        Buffer.from(header),
        buffer ?? Buffer.from([]),
    ]);

    try {
        const signature = p256.sign(prefixedMessageInBuffer, Buffer.from(delegatedKey, 'hex'));

        return ok(asProofOfDelegatedIdentity(Buffer.from(signature).toString('hex')));
    } catch (e) {
        return err(ProofOfDelegatedSignFailed(e));
    }
};
