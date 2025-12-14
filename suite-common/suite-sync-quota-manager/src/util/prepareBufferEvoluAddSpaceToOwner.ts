import { bufferUtils } from '@trezor/utils';

type PrepareBufferEvoluAddSpaceToOwnerParams = {
    publicKey: string;
    ownerId: string;
    challenge: string;
    size: number;
};

export const prepareBufferEvoluAddSpaceToOwner = ({
    publicKey,
    ownerId,
    challenge,
    size,
}: PrepareBufferEvoluAddSpaceToOwnerParams): Buffer => {
    const sizeBuffer = Buffer.alloc(4, 0, 'binary');
    sizeBuffer.writeUInt32BE(size, 0);

    return Buffer.concat([
        bufferUtils.getChunkSize(Buffer.from(publicKey, 'hex').byteLength),
        Buffer.from(publicKey, 'hex'),
        bufferUtils.getChunkSize(Buffer.from(ownerId, 'utf8').byteLength),
        Buffer.from(ownerId, 'utf8'),
        bufferUtils.getChunkSize(Buffer.from(challenge, 'hex').byteLength),
        Buffer.from(challenge, 'hex'),
        bufferUtils.getChunkSize(sizeBuffer.length),
        sizeBuffer,
    ]);
};
