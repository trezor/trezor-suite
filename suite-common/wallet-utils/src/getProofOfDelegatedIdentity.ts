import { p256 } from '@noble/curves/nist.js';

import { ProofOfDelegatedSignFailed } from '@suite-common/suite-sync-types';
import { DelegatedIdentityKey } from '@suite-common/suite-types';
import { ProofOfDelegatedIdentity, asProofOfDelegatedIdentity } from '@trezor/connect';
import { Result, err, ok } from '@trezor/type-utils';
import { bufferUtils } from '@trezor/utils';

export const createProofOfDelegatedSignFailed = (caused: any): ProofOfDelegatedSignFailed => ({
    type: 'ProofOfDelegatedSignFailed',
    caused,
});

export type GetProofOfDelegatedIdentityParams = {
    delegatedKey: DelegatedIdentityKey;
    header: string;
    challenge?: string;
    size?: number;
};

type GetProofOfDelegatedIdentityResult = Result<
    ProofOfDelegatedIdentity,
    ProofOfDelegatedSignFailed
>;

export const getProofOfDelegatedIdentity = ({
    delegatedKey,
    header,
    size,
    challenge,
}: GetProofOfDelegatedIdentityParams): GetProofOfDelegatedIdentityResult => {
    const prefixedMessageInBuffer = Buffer.concat([
        bufferUtils.getChunkSize(header.length),
        Buffer.from(header),

        challenge
            ? bufferUtils.getChunkSize(Buffer.from(challenge, 'hex').byteLength)
            : Buffer.from([]),
        challenge ? Buffer.from(challenge, 'hex') : Buffer.from([]),

        size
            ? bufferUtils.getChunkSize(Buffer.allocUnsafe(4).writeUInt32BE(size, 0))
            : Buffer.from([]),
        size ? Buffer.from(Uint32Array.of(size).buffer) : Buffer.from([]),
    ]);

    try {
        const signature = p256.sign(prefixedMessageInBuffer, Buffer.from(delegatedKey, 'hex'));

        return ok(asProofOfDelegatedIdentity(Buffer.from(signature).toString('hex')));
    } catch (e) {
        return err(createProofOfDelegatedSignFailed(e));
    }
};
