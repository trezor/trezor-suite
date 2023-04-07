import ByteBuffer from 'bytebuffer';
import { MESSAGE_HEADER_BYTE } from '../../constants';
import * as ERRORS from '../../errors';

/**
 * Reads meta information from buffer
 */
const readHeader = (buffer: ByteBuffer) => {
    const typeId = buffer.readUint16();
    const length = buffer.readUint32();

    return { typeId, length };
};

/**
 * Reads meta information from chunked buffer
 */
const readHeaderChunked = (buffer: ByteBuffer) => {
    const sharp1 = buffer.readByte();
    const sharp2 = buffer.readByte();
    const typeId = buffer.readUint16();
    const length = buffer.readUint32();

    return { sharp1, sharp2, typeId, length };
};

export const decode = (byteBuffer: ByteBuffer) => {
    const { typeId } = readHeader(byteBuffer);

    return {
        typeId,
        buffer: byteBuffer,
    };
};

// Parses first raw input that comes from Trezor and returns some information about the whole message.
// [compatibility]: accept Buffer just like decode does. But this would require changes in lower levels
export const decodeChunked = (bytes: ArrayBuffer) => {
    // convert to ByteBuffer so it's easier to read
    const byteBuffer = ByteBuffer.wrap(bytes, undefined, undefined, true);

    const { sharp1, sharp2, typeId, length } = readHeaderChunked(byteBuffer);

    if (sharp1 !== MESSAGE_HEADER_BYTE || sharp2 !== MESSAGE_HEADER_BYTE) {
        // read-write is out of sync
        throw new Error(ERRORS.PROTOCOL_MALFORMED);
    }

    return { length, typeId, restBuffer: byteBuffer };
};
