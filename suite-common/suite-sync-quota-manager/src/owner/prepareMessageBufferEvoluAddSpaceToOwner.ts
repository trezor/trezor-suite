import { bufferUtils } from '@trezor/utils';

type PrepareBufferEvoluAddSpaceToOwnerParams = {
    publicKey: string;
    ownerId: string;
    challenge: string;
    size: number;
};

export const prepareMessageBufferEvoluAddSpaceToOwner = ({
    publicKey,
    ownerId,
    challenge,
    size,
}: PrepareBufferEvoluAddSpaceToOwnerParams): Buffer => {
    const sizeBuffer = Buffer.alloc(4, 0, 'binary');
    sizeBuffer.writeUInt32BE(size, 0);

    const publicKeyBuffer = Buffer.from(publicKey, 'hex');
    const ownerIdBuffer = Buffer.from(ownerId, 'utf8');
    const challengeBuffer = Buffer.from(challenge, 'hex');

    return Buffer.concat([
        bufferUtils.getChunkSize(publicKeyBuffer.byteLength),
        publicKeyBuffer,
        bufferUtils.getChunkSize(ownerIdBuffer.byteLength),
        ownerIdBuffer,
        bufferUtils.getChunkSize(challengeBuffer.byteLength),
        challengeBuffer,
        bufferUtils.getChunkSize(sizeBuffer.length),
        sizeBuffer,
    ]);
};
