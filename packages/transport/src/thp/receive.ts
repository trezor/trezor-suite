// receive with ThpAck

import { decodeMessage } from '@trezor/protobuf';
import { thp as protocolThp, v2 as protocolV2 } from '@trezor/protocol';

import type { AbstractApi } from '../api/abstract';
import { THP_STATE_ERROR } from '../errors';
import { Logger } from '../types';
import { readWithExpectedHeaders } from '../utils/readWithExpectedHeaders';
import { receive } from '../utils/receive';
import { error } from '../utils/result';

export type ReceiveThpMessageProps = {
    apiWrite: (chunk: Buffer, signal?: AbortSignal) => ReturnType<AbstractApi['write']>;
    apiRead: (signal?: AbortSignal) => ReturnType<AbstractApi['read']>;
    thpState?: protocolThp.ThpState;
    skipAck?: boolean;
    signal?: AbortSignal;
    graceful?: boolean;
    logger?: Logger;
};

export const receiveThpMessage = async ({
    thpState,
    skipAck,
    apiRead,
    apiWrite,
    signal,
    graceful,
    logger,
}: ReceiveThpMessageProps) => {
    if (!thpState) {
        return error({ error: THP_STATE_ERROR, message: 'ThpStateMissing' });
    }

    logger?.debug(`receiveThpMessage start ${thpState.expectedResponses}`);

    try {
        const apiReadWithExpectedHeaders = readWithExpectedHeaders(apiRead, {
            signal,
            graceful,
            logger,
        });
        const message = await receive(() => apiReadWithExpectedHeaders(thpState), protocolV2);
        if (!message.success) {
            return message;
        }

        const isAckExpected = protocolThp.isAckExpected(thpState.expectedResponses || []);
        if (!skipAck && isAckExpected) {
            const chunk = protocolThp.encodeAck(thpState);

            logger?.debug(`receiveThpMessage send ThpAck`);

            const ackResult = await apiWrite(chunk, signal);
            if (!ackResult.success) {
                return ackResult;
            }
        }

        logger?.debug(`receiveThpMessage done`);

        return message;
    } catch (err) {
        logger?.error(`receiveThpMessage error ${err.message}`);

        return error({ error: err.code, message: err.message });
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

    return message;
};
