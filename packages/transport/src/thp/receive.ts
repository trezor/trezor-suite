// receive with ThpAck

import { decodeMessage } from '@trezor/protobuf';
import { thp as protocolThp } from '@trezor/protocol';

import { THP_STATE_ERROR } from '../errors';
import { thpLoop } from './loop';
import type { CommonProps } from './receiveExpectedMessage';
import { type receive } from '../utils/receive';
import { error } from '../utils/result';

export const receiveThpMessage = async ({
    thpState,
    apiRead,
    apiWrite,
    signal,
    logger,
    skipAck,
}: Omit<CommonProps, 'chunks'>) => {
    if (!thpState) {
        return error({ code: THP_STATE_ERROR, message: 'ThpStateMissing' });
    }

    const result = await thpLoop({
        thpState,
        apiRead,
        apiWrite,
        signal,
        logger,
        chunks: [],
        skipAck,
        receiveOnly: true,
    });

    // NOTE: result should never be empty
    return result ?? error({ code: THP_STATE_ERROR, message: 'MissingResponse' });
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
