// receive with ThpAck

import type { Root } from 'protobufjs/light';
import { decode as decodeProtobuf, createMessageFromType } from '@trezor/protobuf';
import { thp as protocolThp, v2 as v2Protocol } from '@trezor/protocol';
import { scheduleAction } from '@trezor/utils';

import { receive } from '../utils/receive';
import { error } from '../utils/result';
import { AsyncResultWithTypedError, Logger } from '../types';

export type ReceiveThpMessageProps = {
    apiWrite: (chunk: Buffer, signal?: AbortSignal) => AsyncResultWithTypedError<any, any>;
    apiRead: (signal?: AbortSignal) => AsyncResultWithTypedError<any, any>;
    protocolState?: protocolThp.ThpProtocolState;
    signal?: AbortSignal;
    logger?: Logger;
};

export const readWithExpectedState = async (
    apiRead: ReceiveThpMessageProps['apiRead'],
    protocolState?: protocolThp.ThpProtocolState,
    signal?: AbortSignal,
    logger?: Logger,
): ReturnType<typeof apiRead> => {
    logger?.debug('readWithExpectedState start', protocolState?.expectedResponses);
    const chunk = await apiRead(signal);
    logger?.debug('readWithExpectedState chunk', chunk);
    if (!chunk.success) {
        return chunk;
    }

    const expected = protocolThp.isExpectedResponse(chunk.payload, protocolState);
    if (expected) {
        return { success: true as const, payload: chunk.payload };
    }
    logger?.debug(
        'readWithExpectedState unexpected chunk',
        chunk.payload,
        protocolState?.expectedResponses,
    );
    // handle and exclude this error in scheduleAction attemptFailureHandler
    throw new Error('Unexpected chunk');
};

export const receiveThpMessage = async ({
    protocolState,
    apiRead,
    apiWrite,
    signal,
    logger,
}: ReceiveThpMessageProps): ReturnType<typeof receive> => {
    logger?.debug('receiveThpMessage start', protocolState);
    try {
        const decoded = await receive(
            () =>
                scheduleAction(
                    readSignal => readWithExpectedState(apiRead, protocolState, readSignal, logger),
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

        const isAckExpected = protocolThp.isAckExpected(protocolState?.expectedResponses || []);
        if (isAckExpected) {
            const ack = protocolThp.encodeAck(decoded.payload.header);
            logger?.debug('receiveThpMessage writing ThpAck', ack, typeof apiWrite);
            const ackResult = await apiWrite(ack, signal);
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
    messages: Root;
    decoded: Extract<Awaited<ReturnType<typeof receive>>, { success: true }>['payload'];
    protocolState?: protocolThp.ThpProtocolState;
};

export const parseThpMessage = ({ decoded, messages, protocolState }: ParseThpMessageProps) => {
    const isAckExpected = protocolThp.isAckExpected(protocolState?.expectedResponses || []);

    const protobufDecoder = (protobufMessageType: string | number, protobufPayload: Buffer) => {
        const { Message, messageName } = createMessageFromType(messages, protobufMessageType);
        const message = decodeProtobuf(Message, protobufPayload);

        return {
            messageName,
            message,
        };
    };

    const { messageName, message } = protocolThp.decode(decoded, protobufDecoder, protocolState);

    if (isAckExpected) {
        protocolState?.updateSyncBit('recv');
    }

    if (protocolState?.shouldUpdateNonce(messageName)) {
        protocolState?.updateNonce('send');
        protocolState?.updateNonce('recv');
    }

    return {
        message,
        type: messageName,
    };
};
