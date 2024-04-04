import { Root } from 'protobufjs/light';

import { decode as decodeProtobuf, createMessageFromType } from '@trezor/protobuf';
import { TransportProtocolDecode } from '@trezor/protocol';

async function receiveRest(
    result: Buffer,
    receiver: () => Promise<ArrayBuffer>,
    offset: number,
    expectedLength: number,
): Promise<void> {
    if (offset >= expectedLength) {
        return;
    }
    const data = await receiver();
    // sanity check
    if (data == null) {
        throw new Error('Received no data.');
    }
    const length = offset + data.byteLength - 1;
    Buffer.from(data).copy(result, offset, 1, length);

    return receiveRest(result, receiver, length, expectedLength);
}

export async function receive(
    receiver: () => Promise<ArrayBuffer>,
    decoder: TransportProtocolDecode,
) {
    const data = await receiver();
    const { length, messageType, payload } = decoder(data);
    const result = Buffer.alloc(length);

    if (length) {
        payload.copy(result);
    }

    await receiveRest(result, receiver, payload.length, length);

    return { messageType, payload: result };
}

export async function receiveAndParse(
    messages: Root,
    receiver: () => Promise<ArrayBuffer>,
    decoder: TransportProtocolDecode,
) {
    const { messageType, payload } = await receive(receiver, decoder);
    const { Message, messageName } = createMessageFromType(messages, messageType);
    const message = decodeProtobuf(Message, payload);

    return {
        message,
        type: messageName,
    };
}
