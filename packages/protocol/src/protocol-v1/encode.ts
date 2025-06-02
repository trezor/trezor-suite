import { HEADER_SIZE, MESSAGE_HEADER_BYTE, MESSAGE_MAGIC_HEADER_BYTE } from './constants';
import { TransportProtocol } from '../types';

// header: 3f2323 `?##` and chunkHeader: 3f `?`
export const getHeaders: TransportProtocol['getHeaders'] = () => {
    const header = Buffer.alloc(3);
    // 1 byte
    header.writeUInt8(MESSAGE_MAGIC_HEADER_BYTE, 0);
    // 2*1 byte
    header.writeUInt8(MESSAGE_HEADER_BYTE, 1);
    header.writeUInt8(MESSAGE_HEADER_BYTE, 2);

    const chunkHeader = Buffer.alloc(1);
    chunkHeader.writeUInt8(MESSAGE_MAGIC_HEADER_BYTE);

    return [header, chunkHeader];
};

export const encode: TransportProtocol['encode'] = (data, options) => {
    const { messageType } = options;
    if (typeof messageType === 'string') {
        throw new Error(`Unsupported message type ${messageType}`);
    }

    const fullSize = HEADER_SIZE + data.length;

    const encodedBuffer = Buffer.alloc(fullSize);
    const [header] = getHeaders(data);
    header.copy(encodedBuffer);

    // 2 bytes
    encodedBuffer.writeUInt16BE(messageType, 3);

    // 4 bytes (so 9 in total)
    encodedBuffer.writeUInt32BE(data.length, 5);

    // then put in the actual message
    data.copy(encodedBuffer, HEADER_SIZE);

    return encodedBuffer;
};
