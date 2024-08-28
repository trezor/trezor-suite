import * as ERRORS from '../errors';
import { THP_CONTINUATION_PACKET } from '../protocol-thp/constants';
import { TransportProtocolEncode } from '../types';

export const getChunkHeader = (data: Buffer) => {
    // data should have at least 1 magic byte + 2 bytes channel
    if (data.length < 3) {
        throw new Error(ERRORS.PROTOCOL_MALFORMED);
    }

    const channel = data.subarray(1, 3);
    const header = Buffer.concat([Buffer.from([THP_CONTINUATION_PACKET]), channel]);

    return header;
};

// encode TrezorHostProtocolMessage encoded by `protocol-thp`
export const encode: TransportProtocolEncode = (data, options) => {
    if (options.messageType === 'TrezorHostProtocolMessage') {
        if (!options.header || options.header.length !== 3) {
            throw new Error(
                `${options.messageType} unexpected header ${options.header?.toString('hex')}`,
            );
        }

        const length = Buffer.alloc(2);
        length.writeUInt16BE(data.length);

        return Buffer.concat([options.header, length, data]);
    }

    throw new Error(`Use protocol-thp.encode for messageType ${options.messageType}`);
};
