import { type ProofOfDelegatedSignFailedType } from '@suite-common/delegated-identity-key-types';
import { type DelegatedIdentityKey } from '@suite-common/suite-types';
import { type ProofOfDelegatedIdentity, asProofOfDelegatedIdentity } from '@trezor/connect';
import { type Result, err, ok } from '@trezor/type-utils';
import { bufferUtils } from '@trezor/utils';

export const ProofOfDelegatedSignFailed = (caused: any): ProofOfDelegatedSignFailedType => ({
    type: 'ProofOfDelegatedSignFailed',
    caused,
});

type GetProofOfDelegatedIdentityParams = {
    delegatedKey: DelegatedIdentityKey;
    header: string;
    appendMessageBuffer?: Buffer;
};

type GetProofOfDelegatedIdentityResult = Result<
    ProofOfDelegatedIdentity,
    ProofOfDelegatedSignFailedType
>;

export const getProofOfDelegatedIdentity = async ({
    delegatedKey,
    header,
    appendMessageBuffer: buffer,
}: GetProofOfDelegatedIdentityParams): Promise<GetProofOfDelegatedIdentityResult> => {
    const prefixedMessageInBuffer = Buffer.concat([
        bufferUtils.getChunkSize(header.length),
        Buffer.from(header),
        buffer ?? Buffer.from([]),
    ]);

    try {
        const { p256 } = await import('@noble/curves/nist.js');
        const signature = p256.sign(prefixedMessageInBuffer, Buffer.from(delegatedKey, 'hex'));

        return ok(asProofOfDelegatedIdentity(Buffer.from(signature).toString('hex')));
    } catch (e) {
        return err(ProofOfDelegatedSignFailed(e));
    }
};
