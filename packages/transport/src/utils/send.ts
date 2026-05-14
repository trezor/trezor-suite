import { protobufManager } from '@trezor/protobuf';
import { type ThpState, type TransportProtocol, thp as protocolThp } from '@trezor/protocol';

import { type AsyncResultWithTypedError } from '../types';

export const createChunks = (data: Buffer, chunkHeader: Buffer, chunkSize: number) => {
    if (!chunkSize || data.byteLength <= chunkSize) {
        const buffer = Buffer.alloc(Math.max(chunkSize, data.byteLength));
        data.copy(buffer);

        return [buffer];
    }

    // create first chunk without chunkHeader
    const chunks = [data.subarray(0, chunkSize)];
    // create following chunks prefixed with chunkHeader
    let position = chunkSize;
    while (position < data.byteLength) {
        const sliceEnd = Math.min(position + chunkSize - chunkHeader.byteLength, data.byteLength);
        const slice = data.subarray(position, sliceEnd);
        const chunk = Buffer.concat([chunkHeader, slice]);
        chunks.push(Buffer.alloc(chunkSize).fill(chunk, 0, chunk.byteLength));
        position = sliceEnd;
    }

    return chunks;
};

interface BuildMessageProps {
    name: string;
    data: Record<string, unknown>;
    protocol: TransportProtocol;
    thpState?: ThpState;
}

// common protobufEncoder for protocol v1 and v2 (THP)
export const buildMessage = ({ name, data, protocol, thpState }: BuildMessageProps) => {
    const protobufEncoder = (messageName: string, data: Record<string, unknown>) => {
        const { messageType, message } = protobufManager.encode(messageName, data);

        return protocol.encode(message, { messageType });
    };

    if (protocol.name === 'v2') {
        // THP encoding requires more data than regular protocol.encode
        return protocolThp.encode({
            messageName: name,
            data,
            thpState,
            protobufEncoder: (messageName, data) => protobufManager.encode(messageName, data),
        });
    }

    return protobufEncoder(name, data);
};

export const sendChunks = async <T, E extends string>(
    chunks: Buffer[],
    apiWrite: (chunk: Buffer) => AsyncResultWithTypedError<T, E>,
) => {
    for (let i = 0; i < chunks.length; i++) {
        const result = await apiWrite(chunks[i]);
        if (!result.success) {
            return result;
        }
    }

    return { success: true as const, payload: undefined };
};
