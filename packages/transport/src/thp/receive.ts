// receive with ThpAck

import { decodeMessage } from '@trezor/protobuf';
import { thp as protocolThp, v2 as protocolV2 } from '@trezor/protocol';

import type { AbstractApi } from '../api/abstract';
import { Logger } from '../types';
import { receive } from '../utils/receive';
import { error } from '../utils/result';

export type ReceiveThpMessageProps = {
    apiWrite: (chunk: Buffer, signal?: AbortSignal) => ReturnType<AbstractApi['write']>;
    apiRead: (expectedResponses: Buffer[]) => ReturnType<AbstractApi['read']>;
    thpState?: protocolThp.ThpState;
    signal?: AbortSignal;
    logger?: Logger;
};

export const receiveThpMessage = async ({
    thpState,
    apiRead,
    apiWrite,
    signal,
    logger,
}: ReceiveThpMessageProps): ReturnType<typeof receive> => {
    logger?.log('receiveThpMessage start', thpState?.expectedResponses);
    try {
        if (!thpState) {
            throw new Error('ThpStateMissing');
        }

        const decoded = await receive(
            () => apiRead(protocolThp.getExpectedHeaders(thpState)),
            protocolV2,
        );
        if (!decoded.success) {
            return decoded;
        }

        const isAckExpected = protocolThp.isAckExpected(thpState?.expectedResponses || []);
        if (isAckExpected) {
            const chunk = protocolThp.encodeAck(decoded.payload.header);

            const ackResult = await apiWrite(chunk, signal);
            if (!ackResult.success) {
                return ackResult;
            }
        }

        return decoded;
    } catch (e) {
        logger?.log('receiveThpMessage error', e);

        return error({ error: e.code, message: e.message }); // TODO: confusing error/code/message
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

type ThpReceiveAndParseProps = ReceiveThpMessageProps & {
    messages: Parameters<typeof decodeMessage>[0];
};

export const thpReceiveAndParse = async ({
    messages,
    thpState,
    apiRead,
    apiWrite,
    signal,
    logger,
}: ThpReceiveAndParseProps) => {
    const readResult = await receiveThpMessage({
        thpState,
        apiRead,
        apiWrite,
        signal,
        logger,
    });
    if (!readResult.success) return readResult;

    const message = protocolThp.decode(
        readResult.payload,
        (messageType, payload) => decodeMessage(messages, messageType, payload),
        thpState,
    );

    return message;
};
