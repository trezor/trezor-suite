import { protobufManager } from '@trezor/protobuf';
import { PROTOCOL_MALFORMED, type TransportProtocol } from '@trezor/protocol';

import { error, success } from './result';
import { type AbstractApi, type AbstractApiReadError } from '../api/abstract';
import { type AsyncResultWithTypedError, type MessageResponse } from '../types';

type Receiver = () => ReturnType<AbstractApi['read']>;

// Upper bound for the reassembled message length declared in the wire header.
// `length` is a raw UInt32 taken from the device/bridge response header
// (protocol-v1/protocol-bridge `decode`), so a malicious or MITM'd local bridge
// (localhost:21335/21325) or compromised firmware can declare up to ~4 GiB and
// force an immediate zero-filled `Buffer.alloc(length)` below — a memory-exhaustion
// DoS that fires before a single payload chunk is read. No legitimate Trezor
// device→host message approaches even 1 MiB (device responses are small; large
// payloads are chunked host→device), so 16 MiB is an enormous safety margin while
// a rejected oversized header is turned into a PROTOCOL_MALFORMED result by the
// surrounding try/catch instead of committing gigabytes of memory.
const MESSAGE_MAX_SIZE = 16 * 1024 * 1024;

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
        const data = readResult.payload;
        const { length, messageType, payload, header } = protocol.decode(readResult.payload);
        const [, chunkHeader] = protocol.getHeaders(data);

        // Reject an implausibly large declared length before allocating, so an
        // attacker-controlled wire header can't force a multi-gigabyte allocation.
        if (length > MESSAGE_MAX_SIZE) {
            throw new Error(PROTOCOL_MALFORMED);
        }

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
                    offset = payload.length;
                    console.warn('Restart message reception');

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
): AsyncResultWithTypedError<MessageResponse, ReceiveError> {
    const readResult = await receive(receiver, protocol);
    if (!readResult.success) return readResult;

    const { messageType, payload, length } = readResult.payload;
    const message = protobufManager.decode(messageType, payload.subarray(0, length));

    return success(message);
}
