import ByteBuffer from 'bytebuffer';

/**
 * Reads meta information from buffer
 */
const readHeader = (buffer: ByteBuffer) => {
    const typeId = buffer.readUint16();
    const length = buffer.readUint32();

    return { typeId, length };
};

export const decode = (byteBuffer: ByteBuffer) => {
    const { typeId } = readHeader(byteBuffer);

    return {
        typeId,
        buffer: byteBuffer,
    };
};
