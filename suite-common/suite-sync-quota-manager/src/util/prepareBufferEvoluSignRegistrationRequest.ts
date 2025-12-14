import { bufferUtils } from '@trezor/utils';

type PrepareBufferForEvoluSignRegistrationRequestParams = {
    challenge: string;
    size: number;
};

export const prepareBufferEvoluSignRegistrationRequest = ({
    size,
    challenge,
}: PrepareBufferForEvoluSignRegistrationRequestParams): Buffer => {
    const sizeBuffer = Buffer.alloc(4, 0, 'binary');
    sizeBuffer.writeUInt32BE(size, 0);

    return Buffer.concat([
        bufferUtils.getChunkSize(Buffer.from(challenge, 'hex').byteLength),
        Buffer.from(challenge, 'hex'),
        bufferUtils.getChunkSize(sizeBuffer.length),
        sizeBuffer,
    ]);
};
