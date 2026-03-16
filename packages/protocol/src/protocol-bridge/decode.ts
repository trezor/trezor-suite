import { HEADER_SIZE } from './constants';
import { PROTOCOL_MALFORMED } from '../errors';
import { type TransportProtocolDecode } from '../types';

/**
 * Reads meta information from buffer
 */
const readHeader = (buffer: Buffer) => {
    // 2 bytes
    const messageType = buffer.readUInt16BE();
    // 4 bytes
    const length = buffer.readUInt32BE(2);

    return { messageType, length };
};

export const decode: TransportProtocolDecode = bytes => {
    if (bytes.byteLength < HEADER_SIZE) {
        throw new Error(PROTOCOL_MALFORMED);
    }

    const { messageType, length } = readHeader(bytes);

    return {
        header: Buffer.alloc(0), // bridge does not return header
        messageType,
        length,
        payload: bytes.subarray(HEADER_SIZE),
    };
};
