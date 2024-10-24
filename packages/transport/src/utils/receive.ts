import { Root } from 'protobufjs/light';

import { decode as decodeProtobuf, createMessageFromType } from '@trezor/protobuf';
import { TransportProtocol, TransportProtocolState, thp as protocolThp } from '@trezor/protocol';

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
    // TODO: what if received data is empty? fails on 'Attempt to access memory outside buffer bounds'
    // console.warn('received data', data);
    // const { length, messageType, payload } = protocol.decode(data);
    // console.warn('received data2', length, messageType, payload);
    // const result = Buffer.alloc(length);
    const { length, messageType, payload, header } = protocol.decode(data);
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

    return success({ messageType, payload: result, header, length });
}

export async function receiveAndParse<T extends () => ReturnType<AbstractApi['read']>>(
    messages: Root,
    receiver: T,
    protocol: TransportProtocol,
    protocolState?: TransportProtocolState,
) {
    const readResult = await receive(receiver, protocol);
    if (!readResult.success) return readResult;

    const protobufDecoder = (protobufMessageType: string | number, protobufPayload: Buffer) => {
        const { Message, messageName } = createMessageFromType(messages, protobufMessageType);
        const message = decodeProtobuf(Message, protobufPayload);

        return {
            messageName,
            message,
        };
    };

    if (protocol.name === 'v2') {
        const { messageName, message } = protocolThp.decode(
            readResult.payload,
            protobufDecoder,
            protocolState,
        );

        return success({
            message,
            type: messageName,
        });
    }

    const { messageType, payload } = readResult.payload;
    const { message, messageName } = protobufDecoder(messageType, payload);

    return success({
        message,
        type: messageName,
    });
}
