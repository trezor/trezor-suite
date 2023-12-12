import { HEADER_SIZE } from './constants';
import { TransportProtocolEncode } from '../types';

// this file is basically combination of "trezor v1 protocol" and "bridge protocol"
// there is actually no officially described bridge protocol, but in fact there is one
// it is because bridge does some parts of the protocol itself (like chunking)
export const encode: TransportProtocolEncode = (data, options) => {
    const { messageType } = options;

    const encodedBuffer = Buffer.alloc(HEADER_SIZE + data.length);

    // 2 bytes
    encodedBuffer.writeUInt16BE(messageType);

    // 4 bytes
    encodedBuffer.writeUInt32BE(data.length, 2);

    // then put in the actual message
    data.copy(encodedBuffer, HEADER_SIZE);

    return [encodedBuffer];
};
