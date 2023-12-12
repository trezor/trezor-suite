import {
    HEADER_SIZE,
    MESSAGE_HEADER_BYTE,
    BUFFER_SIZE,
    MESSAGE_MAGIC_HEADER_BYTE,
} from './constants';
import { TransportProtocolEncode } from '../types';

export const encode: TransportProtocolEncode = (data, options) => {
    const { messageType } = options;
    const fullSize = HEADER_SIZE + data.length;
    const chunkSize = options.chunkSize || BUFFER_SIZE;

    const encodedBuffer = Buffer.alloc(fullSize);

    // 2*1 byte
    encodedBuffer.writeUInt8(MESSAGE_HEADER_BYTE, 0);
    encodedBuffer.writeUInt8(MESSAGE_HEADER_BYTE, 1);

    // 2 bytes
    encodedBuffer.writeUInt16BE(messageType, 2);

    // 4 bytes (so 8 in total)
    encodedBuffer.writeUInt32BE(data.length, 4);

    // then put in the actual message
    data.copy(encodedBuffer, HEADER_SIZE);

    const size = chunkSize - 1; // chunkSize - 1 byte of MESSAGE_MAGIC_HEADER_BYTE

    const chunkCount = Math.ceil(encodedBuffer.length / size) || 1;

    // size with one reserved byte for header

    const result: Buffer[] = [];
    // How many pieces will there actually be
    // slice and dice
    for (let i = 0; i < chunkCount; i++) {
        const start = i * size;
        const end = Math.min((i + 1) * size, encodedBuffer.length);

        const buffer = Buffer.alloc(chunkSize);
        buffer.writeUInt8(MESSAGE_MAGIC_HEADER_BYTE);
        encodedBuffer.copy(buffer, 1, start, end);

        result.push(buffer);
    }

    return result;
};
