import { Root } from 'protobufjs/light';

import { decode as decodeProtobuf, createMessageFromType } from '@trezor/protobuf';
import { TransportProtocol } from '@trezor/protocol';

async function receiveRest(
    result: Buffer,
    receiver: () => Promise<Buffer>,
    offset: number,
    expectedLength: number,
    chunkHeader: Buffer,
): Promise<void> {
    if (offset >= expectedLength) {
        return;
    }
    const data = await receiver();
    // sanity check
    if (data == null) {
        throw new Error('Received no data.');
    }
    const length = offset + data.byteLength - chunkHeader.byteLength;
    Buffer.from(data).copy(result, offset, chunkHeader.byteLength, length);

    return receiveRest(result, receiver, length, expectedLength, chunkHeader);
}

export async function receive(receiver: () => Promise<Buffer>, protocol: TransportProtocol) {
    const data = await receiver();
    const { length, messageType, payload } = protocol.decode(data);
    const result = Buffer.alloc(length);
    const chunkHeader = protocol.getChunkHeader(Buffer.from(data));

    if (length) {
        payload.copy(result);
    }

    await receiveRest(result, receiver, payload.length, length, chunkHeader);

    return { messageType, payload: result };
}

export async function receiveAndParse(
    messages: Root,
    receiver: () => Promise<Buffer>,
    protocol: TransportProtocol,
) {
    const { messageType, payload } = await receive(receiver, protocol);
    const { Message, messageName } = createMessageFromType(messages, messageType);
    const message = decodeProtobuf(Message, payload);

    return {
        message,
        type: messageName,
    };
}
