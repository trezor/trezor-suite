import { HEADER_SIZE } from './constants';
import { TransportProtocolDecode } from '../types';

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
    const { messageType, length } = readHeader(bytes);

    return {
        header: Buffer.alloc(0), // bridge doesn't return header
        messageType,
        length,
        payload: bytes.subarray(HEADER_SIZE),
    };
};
