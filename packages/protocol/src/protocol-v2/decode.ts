import * as ERRORS from '../errors';
import { getChunkHeader } from './encode';
import { TransportProtocolDecode } from '../types';

// Parses raw input (first chunk) that comes from Trezor and returns some information about the whole message.
export const decode: TransportProtocolDecode = bytes => {
    const buffer = Buffer.from(bytes);

    // data should have at least 3 bytes `header` + 2 bytes `length`
    if (buffer.length < 5) {
        throw new Error(ERRORS.PROTOCOL_MALFORMED);
    }

    return {
        header: buffer.subarray(0, 3),
        chunkHeader: getChunkHeader(buffer),
        length: buffer.readUint16BE(3),
        messageType: 'TrezorHostProtocolMessage',
        payload: buffer.subarray(1 + 2 + 2),
    };
};
