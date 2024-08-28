import * as ERRORS from '../errors';
import { HEADER_SIZE, MESSAGE_LEN_SIZE, MESSAGE_TYPE } from './constants';
import { TransportProtocolEncode } from '../types';

export const getChunkHeader = (data: Buffer) => {
    // data should have at least 1 control_byte + 2 bytes channel
    if (data.byteLength < HEADER_SIZE) {
        throw new Error(ERRORS.PROTOCOL_MALFORMED);
    }

    const channel = data.subarray(1, HEADER_SIZE);
    const header = Buffer.concat([Buffer.from([0x80]), channel]); // THP_CONTINUATION_PACKET

    return header;
};

// encode `protocol-thp` message
export const encode: TransportProtocolEncode = (data, options) => {
    if (options.messageType === MESSAGE_TYPE) {
        if (!options.header || options.header.byteLength !== HEADER_SIZE) {
            throw new Error(
                `${options.messageType} unexpected header ${options.header?.toString('hex')}`,
            );
        }

        const length = Buffer.alloc(MESSAGE_LEN_SIZE);
        length.writeUInt16BE(data.length);

        return Buffer.concat([options.header, length, data]);
    }

    throw new Error(`Use protocol-thp.encode for messageType ${options.messageType}`);
};
