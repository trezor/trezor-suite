import ByteBuffer from 'bytebuffer';

import { TransportProtocolDecode } from '../types';

/**
 * Reads meta information from buffer
 */
const readHeader = (buffer: ByteBuffer) => {
    const typeId = buffer.readUint16();
    const length = buffer.readUint32();

    return { typeId, length };
};

export const decode: TransportProtocolDecode = bytes => {
    const byteBuffer = ByteBuffer.wrap(bytes, undefined, undefined, true);
    const { typeId, length } = readHeader(byteBuffer);

    return {
        typeId,
        length,
        buffer: byteBuffer,
    };
};
