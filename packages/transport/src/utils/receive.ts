import { decodeMessage } from '@trezor/protobuf';
import { PROTOCOL_MALFORMED, type TransportProtocol } from '@trezor/protocol';

import { error, success } from './result';
import { type AbstractApi } from '../api/abstract';

type Receiver = () => ReturnType<AbstractApi['read']>;

export async function receive<T extends Receiver>(receiver: T, protocol: TransportProtocol) {
    const readResult = await receiver();
    if (!readResult.success) {
        return readResult;
    }

    try {
        const data = readResult.payload;
        const { length, messageType, payload, header } = protocol.decode(readResult.payload);
        const [, chunkHeader] = protocol.getHeaders(data);

        const result: Buffer = Buffer.alloc(length);
        payload.copy(result);

        let offset = payload.length;
        while (offset < length) {
            const readResult = await receiver();
            if (!readResult.success) {
                return readResult;
            }
            const data = readResult.payload;
            const dataChunkHeader = data.subarray(0, chunkHeader.length);
            if (dataChunkHeader.compare(chunkHeader) !== 0) {
                throw new Error(`Unexpected chunkHeader ${dataChunkHeader.toString('hex')}`);
            }

            Buffer.from(data).copy(result, offset, chunkHeader.byteLength);
            offset += data.byteLength - chunkHeader.byteLength;
        }

        return success({ messageType, payload: result, header, length });
    } catch (e) {
        console.warn('Protocol decode failed', {
            error: e.message,
            payload: readResult.payload.toString('hex'),
        });

        return error({ code: PROTOCOL_MALFORMED, message: e.message });
    }
}

export async function receiveAndParse<T extends Receiver>(
    messages: Parameters<typeof decodeMessage>[0],
    receiver: T,
    protocol: TransportProtocol,
) {
    const readResult = await receive(receiver, protocol);
    if (!readResult.success) return readResult;

    const { messageType, payload } = readResult.payload;
    const message = decodeMessage(messages, messageType, payload);

    return success(message);
}
