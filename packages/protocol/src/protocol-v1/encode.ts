import { HEADER_SIZE, MESSAGE_HEADER_BYTE, MESSAGE_MAGIC_HEADER_BYTE } from './constants';
import { TransportProtocolEncode } from '../types';

export const getChunkHeader = (_data: Buffer) => {
    const header = Buffer.alloc(1);
    header.writeUInt8(MESSAGE_MAGIC_HEADER_BYTE);

    return header;
};

export const encode: TransportProtocolEncode = (data, options) => {
    const { messageType } = options;
    if (typeof messageType === 'string') {
        throw new Error(`Unsupported message type ${messageType}`);
    }

    const fullSize = HEADER_SIZE + data.length;

    const encodedBuffer = Buffer.alloc(fullSize);
    // 1 byte
    encodedBuffer.writeUInt8(MESSAGE_MAGIC_HEADER_BYTE, 0);

    // 2*1 byte
    encodedBuffer.writeUInt8(MESSAGE_HEADER_BYTE, 1);
    encodedBuffer.writeUInt8(MESSAGE_HEADER_BYTE, 2);

    // 2 bytes
    encodedBuffer.writeUInt16BE(messageType, 3);

    // 4 bytes (so 9 in total)
    encodedBuffer.writeUInt32BE(data.length, 5);

    // then put in the actual message
    data.copy(encodedBuffer, HEADER_SIZE);

    return encodedBuffer;
};
