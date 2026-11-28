import { protobufManager } from '@trezor/protobuf';
import { PROTOCOL_MALFORMED, type TransportProtocol } from '@trezor/protocol';

import { error, success } from './result';
import { type AbstractApi, type AbstractApiReadError } from '../api/abstract';
import { type AsyncResultWithTypedError, type MessageResponse } from '../types';

type Receiver = () => ReturnType<AbstractApi['read']>;

type ReceiveError = AbstractApiReadError | typeof PROTOCOL_MALFORMED;

type ReceivePayload = {
    messageType: number;
    payload: Buffer;
    header: Buffer;
    length: number;
};

export async function receive<T extends Receiver>(
    receiver: T,
    protocol: TransportProtocol,
): AsyncResultWithTypedError<ReceivePayload, ReceiveError> {
    const readResult = await receiver();
    if (!readResult.success) {
        return readResult;
    }

    try {
        const firstPacketBytes = readResult.payload;
        const { length, messageType, payload, header } = protocol.decode(readResult.payload);
        const [, chunkHeader] = protocol.getHeaders(firstPacketBytes);

        const result: Buffer = Buffer.alloc(length);
        payload.copy(result);

        let offset = payload.length;
        while (offset < length) {
            const readResult = await receiver();
            if (!readResult.success) {
                return readResult;
            }
            const data = readResult.payload;
            // Check for a retransmitted first packet before checking the chunk header. On
            // protocol-v1 the chunk header is itself a byte-prefix of the message header, so a
            // chunk-header-first check can never distinguish a genuine continuation chunk from a
            // retransmitted first packet - the branch below would never fire and a restart would
            // silently corrupt the payload instead of being recovered.
            //
            // Compare against the full saved first-packet bytes (not just the short protocol
            // header), and require an exact length match first. Real chunked transports pad
            // every packet - first and continuation alike - to the same fixed chunk size (see
            // `createChunks`), so a genuine retransmit is always byte-identical in both length
            // and content to the original first packet, while a differently-sized continuation
            // can never be one. Requiring the full buffer to match (not just a shared prefix)
            // makes a coincidental false-positive on real, differently-sized continuation data
            // effectively impossible, rather than merely unlikely.
            // `header.length === 0` (e.g. protocol-bridge, which has no chunk framing at all) is
            // guarded out entirely, matching that protocol's original behaviour of never treating
            // any input as a restart.
            if (header.length > 0) {
                if (data.length === firstPacketBytes.length && data.equals(firstPacketBytes)) {
                    offset = payload.length;
                    console.warn('Restart message reception');

                    continue;
                }
            }

            const dataChunkHeader = data.subarray(0, chunkHeader.length);
            if (dataChunkHeader.compare(chunkHeader) !== 0) {
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
): AsyncResultWithTypedError<MessageResponse, ReceiveError> {
    const readResult = await receive(receiver, protocol);
    if (!readResult.success) return readResult;

    const { messageType, payload, length } = readResult.payload;
    const message = protobufManager.decode(messageType, payload.subarray(0, length));

    return success(message);
}
