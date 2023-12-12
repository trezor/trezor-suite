import { HEADER_SIZE } from './constants';
import { TransportProtocolDecode } from '../types';

/**
 * Reads meta information from buffer
 */
const readHeader = (buffer: Buffer) => {
    // 2 bytes
    const typeId = buffer.readUInt16BE();
    // 4 bytes
    const length = buffer.readUInt32BE(2);

    return { typeId, length };
};

export const decode: TransportProtocolDecode = bytes => {
    const buffer = Buffer.from(bytes);
    const { typeId, length } = readHeader(buffer);

    return {
        typeId,
        length,
        buffer: buffer.subarray(HEADER_SIZE),
    };
};
