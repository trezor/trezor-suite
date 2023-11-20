import ByteBuffer from 'bytebuffer';

import { HEADER_SIZE } from '../protocol-v1/constants';
import { TransportProtocolEncode } from '../types';

// this file is basically combination of "trezor v1 protocol" and "bridge protocol"
// there is actually no officially described bridge protocol, but in fact there is one
// it is because bridge does some parts of the protocol itself (like chunking)
export const encode: TransportProtocolEncode = (data, options) => {
    const { messageType } = options;
    const fullSize = HEADER_SIZE - 2 + data.limit;

    const encodedByteBuffer = new ByteBuffer(fullSize);

    // 2 bytes
    encodedByteBuffer.writeUint16(messageType);

    // 4 bytes
    encodedByteBuffer.writeUint32(data.limit);

    // then put in the actual message
    encodedByteBuffer.append(data.buffer);

    encodedByteBuffer.reset();

    // todo: it would be nicer to return Buffer instead of ByteBuffer. The problem is that ByteBuffer.Buffer.toString behaves differently in web and node.
    // anyway, for now we can keep this legacy behavior
    return [encodedByteBuffer];
};
