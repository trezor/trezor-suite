import ByteBuffer from 'bytebuffer';

import * as ERRORS from '../errors';
import { MESSAGE_HEADER_BYTE, MESSAGE_MAGIC_HEADER_BYTE } from './constants';
import { TransportProtocolDecode } from '../types';

/**
 * Reads meta information from chunked buffer
 */
const readHeaderChunked = (buffer: ByteBuffer) => {
    const magic = buffer.readByte();
    const sharp1 = buffer.readByte();
    const sharp2 = buffer.readByte();
    const typeId = buffer.readUint16();
    const length = buffer.readUint32();

    return { magic, sharp1, sharp2, typeId, length };
};

// Parses first raw input that comes from Trezor and returns some information about the whole message.
// [compatibility]: accept Buffer just like decode does. But this would require changes in lower levels
export const decode: TransportProtocolDecode = bytes => {
    // convert to ByteBuffer so it's easier to read
    const byteBuffer = ByteBuffer.wrap(bytes, undefined, undefined, true);

    const { magic, sharp1, sharp2, typeId, length } = readHeaderChunked(byteBuffer);

    if (
        magic !== MESSAGE_MAGIC_HEADER_BYTE ||
        sharp1 !== MESSAGE_HEADER_BYTE ||
        sharp2 !== MESSAGE_HEADER_BYTE
    ) {
        // read-write is out of sync
        throw new Error(ERRORS.PROTOCOL_MALFORMED);
    }

    return { length, typeId, buffer: byteBuffer };
};
