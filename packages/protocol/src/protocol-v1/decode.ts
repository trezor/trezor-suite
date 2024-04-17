import * as ERRORS from '../errors';
import { HEADER_SIZE, MESSAGE_HEADER_BYTE, MESSAGE_MAGIC_HEADER_BYTE } from './constants';
import { TransportProtocolDecode } from '../types';

/**
 * Reads meta information from chunked buffer
 */
const readHeaderChunked = (buffer: Buffer) => {
    // 1 byte
    const magic = buffer.readUInt8();
    // 1 byte
    const sharp1 = buffer.readUInt8(1);
    // 1 byte
    const sharp2 = buffer.readUInt8(2);
    // 2 bytes
    const messageType = buffer.readUInt16BE(3);
    // 4 bytes
    const length = buffer.readUInt32BE(5);

    return { magic, sharp1, sharp2, messageType, length };
};

// Parses first raw input that comes from Trezor and returns some information about the whole message.
// [compatibility]: accept Buffer just like decode does. But this would require changes in lower levels
export const decode: TransportProtocolDecode = bytes => {
    const buffer = Buffer.from(bytes);
    const { magic, sharp1, sharp2, messageType, length } = readHeaderChunked(buffer);

    if (
        magic !== MESSAGE_MAGIC_HEADER_BYTE ||
        sharp1 !== MESSAGE_HEADER_BYTE ||
        sharp2 !== MESSAGE_HEADER_BYTE
    ) {
        // read-write is out of sync
        throw new Error(ERRORS.PROTOCOL_MALFORMED);
    }

    return {
        length,
        messageType,
        payload: buffer.subarray(HEADER_SIZE),
    };
};
