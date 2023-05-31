import ByteBuffer from 'bytebuffer';
import { Root } from 'protobufjs/light';

import { decode as decodeProtobuf, createMessageFromType } from '@trezor/protobuf';
import { v1 as protocolV1 } from '@trezor/protocol';

export function receiveOne(messages: Root, data: string) {
    const bytebuffer = ByteBuffer.wrap(data, 'hex');

    const { typeId, buffer } = protocolV1.decode(bytebuffer);
    const { Message, messageName } = createMessageFromType(messages, typeId);
    const message = decodeProtobuf(Message, buffer);
    return {
        message,
        type: messageName,
    };
}

async function receiveRest(
    parsedInput: ByteBuffer,
    receiver: () => Promise<ArrayBuffer>,
    expectedLength: number,
): Promise<void> {
    if (parsedInput.offset >= expectedLength) {
        return;
    }
    const data = await receiver();
    // sanity check
    if (data == null) {
        throw new Error('Received no data.');
    }

    parsedInput.append(data);

    return receiveRest(parsedInput, receiver, expectedLength);
}

async function receiveBuffer(receiver: () => Promise<ArrayBuffer>) {
    const data = await receiver();
    const { length, typeId, restBuffer } = protocolV1.decodeChunked(data);
    const decoded = new ByteBuffer(length);
    if (length) {
        decoded.append(restBuffer);
    }
    await receiveRest(decoded, receiver, length);
    return { received: decoded, typeId };
}

export async function receiveAndParse(messages: Root, receiver: () => Promise<ArrayBuffer>) {
    const { received, typeId } = await receiveBuffer(receiver);
    const { Message, messageName } = createMessageFromType(messages, typeId);
    received.reset();
    const message = decodeProtobuf(Message, received);
    return {
        message,
        type: messageName,
    };
}
