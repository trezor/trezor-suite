// receive with ThpAck

import { decodeMessage } from '@trezor/protobuf';
import { thp as protocolThp, v2 as v2Protocol } from '@trezor/protocol';
import { scheduleAction } from '@trezor/utils';

import { AsyncResultWithTypedError, Logger } from '../types';
import { receive } from '../utils/receive';
import { error } from '../utils/result';

export type ReceiveThpMessageProps = {
    apiChunkSize: number;
    apiWrite: (chunk: Buffer, signal?: AbortSignal) => AsyncResultWithTypedError<any, any>;
    apiRead: (signal?: AbortSignal) => AsyncResultWithTypedError<any, any>;
    thpState?: protocolThp.ThpState;
    signal?: AbortSignal;
    logger?: Logger;
};

export const readWithExpectedState = async (
    apiRead: ReceiveThpMessageProps['apiRead'],
    thpState?: protocolThp.ThpState,
    signal?: AbortSignal,
    logger?: Logger,
): ReturnType<typeof apiRead> => {
    logger?.debug('readWithExpectedState start', thpState?.expectedResponses);
    const chunk = await apiRead(signal);
    if (!chunk.success) {
        return chunk;
    }

    logger?.debug('readWithExpectedState chunk', chunk.payload.toString('hex'));
    const expected = protocolThp.isExpectedResponse(chunk.payload, thpState);
    if (expected) {
        return { success: true as const, payload: chunk.payload };
    }
    logger?.debug(
        'readWithExpectedState unexpected chunk',
        chunk.payload,
        thpState?.expectedResponses,
    );
    // handle and exclude this error in scheduleAction attemptFailureHandler
    throw new Error('Unexpected chunk');
};

export const receiveThpMessage = async ({
    thpState,
    apiChunkSize,
    apiRead,
    apiWrite,
    signal,
    logger,
}: ReceiveThpMessageProps): ReturnType<typeof receive> => {
    logger?.debug('receiveThpMessage start');
    try {
        const decoded = await receive(
            () =>
                scheduleAction(
                    readSignal => readWithExpectedState(apiRead, thpState, readSignal, logger),
                    {
                        signal,
                        attempts: 20,
                        attemptFailureHandler: e => {
                            if (e.message !== 'Unexpected chunk') {
                                // break attempts on unexpected errors
                                return e;
                            }
                        },
                    },
                ),
            v2Protocol,
        );
        if (!decoded.success) {
            return decoded;
        }

        const isAckExpected = protocolThp.isAckExpected(thpState?.expectedResponses || []);
        if (isAckExpected) {
            const chunk = Buffer.alloc(apiChunkSize).fill(0);
            protocolThp.encodeAck(decoded.payload.header).copy(chunk, 0);

            const ackResult = await apiWrite(chunk, signal);
            if (!ackResult.success) {
                return ackResult;
            }
        }

        return decoded;
    } catch (e) {
        logger?.debug('receiveThpMessage error', error);

        return error({ error: e.message });
    }
};

export type ParseThpMessageProps = {
    messages: Parameters<typeof decodeMessage>[0];
    decoded: Extract<Awaited<ReturnType<typeof receive>>, { success: true }>['payload'];
    thpState?: protocolThp.ThpState;
};

export const parseThpMessage = ({ decoded, messages, thpState }: ParseThpMessageProps) => {
    const message = protocolThp.decode(
        decoded,
        (messageType, data) => decodeMessage(messages, messageType, data),
        thpState,
    );

    // TODO: isAckExpected() should be method of thpState?
    if (protocolThp.isAckExpected(thpState?.expectedResponses || [])) {
        thpState?.updateSyncBit('recv');
    }

    if (thpState?.shouldUpdateNonce(message.type)) {
        thpState?.updateNonce('recv');
    }

    return message;
};
