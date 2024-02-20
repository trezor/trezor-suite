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

async function receiveBuffer(
    receiver: () => Promise<ArrayBuffer>,
    decoder: TransportProtocolDecode,
) {
    const data = await receiver();
    const { length, typeId, buffer } = decoder(data);
    const result = Buffer.alloc(length);

    if (length) {
        buffer.copy(result);
    }

    await receiveRest(result, receiver, buffer.length, length);

    return { received: result, typeId };
}

export async function receive(
    receiver: () => Promise<ArrayBuffer>,
    decoder: TransportProtocolDecode,
) {
    const { received, typeId } = await receiveBuffer(receiver, decoder);

    return {
        typeId,
        buffer: received,
    };
}

export async function receiveAndParse(
    messages: Root,
    receiver: () => Promise<ArrayBuffer>,
    decoder: TransportProtocolDecode,
) {
    const { buffer, typeId } = await receive(receiver, decoder);
    const { Message, messageName } = createMessageFromType(messages, typeId);
    const message = decodeProtobuf(Message, buffer);

    return {
        message,
        type: messageName,
    };
}
