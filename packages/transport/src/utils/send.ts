// Logic of sending data to trezor
//
// Logic of "call" is broken to two parts - sending and receiving
import { Root } from 'protobufjs/light';
import { encode as encodeProtobuf, createMessageFromName } from '@trezor/protobuf';
import { v1 as protocolV1, bridge as bridgeProtocol } from '@trezor/protocol';

// Sends more buffers to device.
async function sendBuffers(sender: (data: Buffer) => Promise<void>, buffers: Array<Buffer>) {
    for (const buffer of buffers) {
        await sender(buffer);
    }
}

// Sends message to device.
// Resolves if everything gets sent
export function buildOne(messages: Root, name: string, data: Record<string, unknown>) {
    const { Message, messageType } = createMessageFromName(messages, name);

    const buffer = encodeProtobuf(Message, data);
    return bridgeProtocol.encode(buffer, {
        messageType,
    });
}

export const buildBuffers = (messages: Root, name: string, data: Record<string, unknown>) => {
    const { Message, messageType } = createMessageFromName(messages, name);
    const buffer = encodeProtobuf(Message, data);
    return protocolV1.encode(buffer, {
        messageType,
    });
};

// Sends message to device.
// Resolves if everything gets sent
export function buildAndSend(
    messages: Root,
    sender: (data: Buffer) => Promise<void>,
    name: string,
    data: Record<string, unknown>,
) {
    const buffers = buildBuffers(messages, name, data);
    return sendBuffers(sender, buffers);
}
