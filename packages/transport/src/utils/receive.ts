import { decodeMessage } from '@trezor/protobuf';
import { ThpState, TransportProtocol, thp as protocolThp } from '@trezor/protocol';

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
    const result = Buffer.alloc(length);
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
    messages: Parameters<typeof decodeMessage>[0],
    receiver: T,
    protocol: TransportProtocol,
    thpState?: ThpState,
) {
    const readResult = await receive(receiver, protocol);
    if (!readResult.success) return readResult;

    if (protocol.name === 'v2') {
        const message = protocolThp.decode(
            readResult.payload,
            (messageType, payload) => decodeMessage(messages, messageType, payload),
            thpState,
        );

        return success(message);
    }

    const { messageType, payload } = readResult.payload;
    const message = decodeMessage(messages, messageType, payload);

    return success(message);
}
