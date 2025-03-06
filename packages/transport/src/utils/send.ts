import { encodeMessage } from '@trezor/protobuf';
import { TransportProtocol } from '@trezor/protocol';

import { AsyncResultWithTypedError } from '../types';

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
    messages: Parameters<typeof encodeMessage>[0];
    name: string;
    data: Record<string, unknown>;
    protocol: TransportProtocol;
}

export const buildMessage = ({ messages, name, data, protocol }: BuildMessageProps) => {
    const { messageType, message } = encodeMessage(messages, name, data);

    return protocol.encode(message, { messageType });
};

export const sendChunks = async <T, E>(
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
