import * as ERRORS from '../errors';
import { HEADER_SIZE, MESSAGE_LEN_SIZE, MESSAGE_TYPE } from './constants';
import { getHeaders } from './encode';
import { TransportProtocolDecode } from '../types';

// Parses raw input from Trezor and returns some information about the whole message
export const decode: TransportProtocolDecode = bytes => {
    const buffer = Buffer.from(bytes);

    // chunk should have at least 5 bytes. 3 bytes `header` + 2 bytes `length`
    if (buffer.byteLength < HEADER_SIZE + MESSAGE_LEN_SIZE) {
        throw new Error(ERRORS.PROTOCOL_MALFORMED);
    }

    const [header, chunkHeader] = getHeaders(buffer);

    return {
        header,
        chunkHeader,
        length: buffer.readUint16BE(HEADER_SIZE),
        messageType: MESSAGE_TYPE, // will be decoded by `protocol-thp`
        payload: buffer.subarray(HEADER_SIZE + MESSAGE_LEN_SIZE),
    };
};
