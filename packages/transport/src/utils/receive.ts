import { Root } from 'protobufjs/light';

import { decode as decodeProtobuf, createMessageFromType } from '@trezor/protobuf';
import { TransportProtocol } from '@trezor/protocol';

import { success } from './result';
import { AbstractApi } from '../api/abstract';

export async function receive<T extends () => ReturnType<AbstractApi['read']>>(
    receiver: T,
    protocol: TransportProtocol,
) {
    const readResult = await receiver();
    if (!readResult.success) {
        return readResult;
    }
    const data = readResult.payload;
    const { length, messageType, payload } = protocol.decode(data);
    let result = Buffer.alloc(length);
    const chunkHeader = protocol.getChunkHeader(Buffer.from(data));

    payload.copy(result);
    let offset = payload.length;

    while (offset < length) {
        const readResult = await receiver();

        if (!readResult.success) {
            return readResult;
        }
        const data = readResult.payload;

        Buffer.from(data).copy(result, offset, chunkHeader.byteLength);
        offset += data.byteLength - chunkHeader.byteLength;
    }

    return success({ messageType, payload: result });
}

export async function receiveAndParse<T extends () => ReturnType<AbstractApi['read']>>(
    messages: Root,
    receiver: T,
    protocol: TransportProtocol,
) {
    const readResult = await receive(receiver, protocol);
    if (!readResult.success) return readResult;

    const { messageType, payload } = readResult.payload;
    const { Message, messageName } = createMessageFromType(messages, messageType);
    const message = decodeProtobuf(Message, payload);

    return success({
        message,
        type: messageName,
    });
}
