import ByteBuffer from 'bytebuffer';
import { Root } from 'protobufjs/light';

import { decode as decodeProtobuf, createMessageFromType } from '@trezor/protobuf';
import { TransportProtocolDecode } from '@trezor/protocol';

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
    parsedInput.append(data.slice(1));

    return receiveRest(parsedInput, receiver, expectedLength);
}

async function receiveBuffer(
    receiver: () => Promise<ArrayBuffer>,
    decoder: TransportProtocolDecode,
) {
    const data = await receiver();
    const { length, typeId, buffer } = decoder(data);
    const decoded = new ByteBuffer(length);

    if (length) {
        decoded.append(buffer);
    }
    await receiveRest(decoded, receiver, length);
    return { received: decoded, typeId };
}

export async function receiveAndParse(
    messages: Root,
    receiver: () => Promise<ArrayBuffer>,
    decoder: TransportProtocolDecode,
) {
    const { received, typeId } = await receiveBuffer(receiver, decoder);
    const { Message, messageName } = createMessageFromType(messages, typeId);
    received.reset();
    const message = decodeProtobuf(Message, received);
    return {
        message,
        type: messageName,
    };
}
