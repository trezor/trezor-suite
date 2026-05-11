import { protobufManager } from '@trezor/protobuf';
import { PROTOCOL_MALFORMED, type TransportProtocol } from '@trezor/protocol';

import { error, success } from './result';
import { type AbstractApi } from '../api/abstract';

type Receiver = () => ReturnType<AbstractApi['read']>;

export async function receive<T extends Receiver>(receiver: T, protocol: TransportProtocol) {
    const readResult = await receiver();
    if (!readResult.success) {
        return readResult;
    }

    try {
        const data = readResult.payload;
        const { length, messageType, payload, header } = protocol.decode(readResult.payload);
        const [, chunkHeader] = protocol.getHeaders(data);

        const result: Buffer = Buffer.alloc(length);
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
                if (header.compare(data.subarray(0, header.length)) === 0) {
                    console.warn('Received header again. Restarting receiving process', {
                        header: header.toString('hex'),
                        data: data.toString('hex'),
                    });
                    offset = payload.length;

                    Buffer.from(payload).copy(result, 0, 0, payload.length);

                    continue;
                }

                throw new Error(`Unexpected chunkHeader ${dataChunkHeader.toString('hex')}`);
            }

            Buffer.from(data).copy(result, offset, chunkHeader.byteLength);
            offset += data.byteLength - chunkHeader.byteLength;
        }

        return success({ messageType, payload: result, header, length });
    } catch (e) {
        console.warn('Protocol decode failed', {
            error: e.message,
            payload: readResult.payload.toString('hex'),
        });

        return error({ code: PROTOCOL_MALFORMED, message: e.message });
    }
}

export async function receiveAndParse<T extends Receiver>(
    receiver: T,
    protocol: TransportProtocol,
) {
    const readResult = await receive(receiver, protocol);
    if (!readResult.success) return readResult;

    const { messageType, payload, length } = readResult.payload;
    const message = protobufManager.decode(messageType, payload.subarray(0, length));

    return success(message);
}
