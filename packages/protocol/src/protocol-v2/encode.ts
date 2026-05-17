import * as ERRORS from '../errors';
import { HEADER_SIZE, MESSAGE_LEN_SIZE, THP_CONTROL_BYTE } from './constants';
import { type TransportProtocol } from '../types';

const getChunkHeader = (data: Buffer) => {
    // data should have at least 1 control_byte + 2 bytes channel
    if (data.byteLength < HEADER_SIZE) {
        throw new Error(ERRORS.PROTOCOL_MALFORMED);
    }

    const channel = data.subarray(1, HEADER_SIZE);
    const header = Buffer.concat([Buffer.from([THP_CONTROL_BYTE.CONTINUATION_PACKET]), channel]);

    return header;
};

export const getHeaders: TransportProtocol['getHeaders'] = data => {
    const chunkHeader = getChunkHeader(data);

    return [data.subarray(0, HEADER_SIZE), chunkHeader];
};

// encode `protocol-thp` message
export const encode: TransportProtocol['encode'] = (data, options) => {
    if (options.header?.byteLength !== HEADER_SIZE) {
        throw new Error(ERRORS.PROTOCOL_MALFORMED);
    }

    const length = Buffer.alloc(MESSAGE_LEN_SIZE);
    length.writeUInt16BE(data.length);

    return Buffer.concat([options.header, length, data]);
};
