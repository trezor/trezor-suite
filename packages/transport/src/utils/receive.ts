import { decodeMessage } from '@trezor/protobuf';
import { TransportProtocol } from '@trezor/protocol';
import { PROTOCOL_MALFORMED } from '@trezor/protocol/src/errors';

import { success } from './result';
import { AbstractApi } from '../api/abstract';

type Receiver = () => ReturnType<AbstractApi['read']>;

// The length comes from the wire header, so a rogue device or bridge could otherwise make us
// allocate up to 4 GiB. Device responses are far smaller than this limit.
const MESSAGE_MAX_SIZE = 16 * 1024 * 1024;

export async function receive<T extends Receiver>(receiver: T, protocol: TransportProtocol) {
    const readResult = await receiver();
    if (!readResult.success) {
        return readResult;
    }
    const data = readResult.payload;
    const { length, messageType, payload, header } = protocol.decode(data);
    if (length > MESSAGE_MAX_SIZE) {
        throw new Error(PROTOCOL_MALFORMED);
    }
    const result = Buffer.alloc(length);
    const [, chunkHeader] = protocol.getHeaders(Buffer.from(data));

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
