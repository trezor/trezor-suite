import { bufferUtils } from '@trezor/utils';

type PrepareBufferForEvoluSignRegistrationRequestParams = {
    challenge: string;
    size: number;
};

export const prepareMessageBufferEvoluSignRegistrationRequest = ({
    size,
    challenge,
}: PrepareBufferForEvoluSignRegistrationRequestParams): Buffer => {
    const sizeBuffer = Buffer.alloc(4, 0, 'binary');
    sizeBuffer.writeUInt32BE(size, 0);

    const challengeBuffer = Buffer.from(challenge, 'hex');

    return Buffer.concat([
        bufferUtils.getChunkSize(challengeBuffer.byteLength),
        challengeBuffer,
        bufferUtils.getChunkSize(sizeBuffer.length),
        sizeBuffer,
    ]);
};
