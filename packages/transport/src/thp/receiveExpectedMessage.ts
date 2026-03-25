import {
    PROTOCOL_MALFORMED,
    type ThpState,
    thp as protocolThp,
    v2 as protocolV2,
} from '@trezor/protocol';
import { THP_CONTROL_BYTE } from '@trezor/protocol/src/protocol-v2/constants';
import { SCHEDULE_ACTION_TIMEOUT_ERROR_MESSAGE, scheduleAction } from '@trezor/utils';

import type { AbstractApi } from '../api/abstract';
import { type Logger } from '../types';
import { receive } from '../utils/receive';
import { error } from '../utils/result';

export const ATTEMPTS_LIMIT = 10;
export const THP_ACK_TIMEOUT = 10_000;
export const THP_ACK_DEADLINE = 30_000;

export type ReceiveResult = Awaited<ReturnType<typeof receive>>;
type ReceiveSuccess = Extract<ReceiveResult, { success: true }>;
type ReceiveError = Extract<ReceiveResult, { success: false }>;
type ReceiveExpectedMessageError = ReturnType<
    typeof error<
        | 'UnexpectedChunk'
        | 'UnexpectedChannel'
        | 'UnexpectedCRC'
        | 'UnexpectedRecvBit'
        | 'UnexpectedRecentMessage'
        | 'UnexpectedMessage'
        | 'Timeout'
    >
>;

export type CommonProps = {
    apiWrite: (chunk: Buffer, signal?: AbortSignal) => ReturnType<AbstractApi['write']>;
    apiRead: (signal?: AbortSignal) => ReturnType<AbstractApi['read']>;
    thpState?: ThpState;
    skipAck?: boolean;
    signal?: AbortSignal;
    logger?: Logger;
    chunks: Buffer[];
};

const isRecentMessage = (msg: ReceiveSuccess, thpState: ThpState) => {
    if (thpState.recentMessage.length > 0) {
        return thpState.recentMessage.compare(protocolThp.getCRC(msg.payload)) === 0;
    }

    return false;
};

// TODO: create it in scheduleAction
type ScheduleActionError = typeof SCHEDULE_ACTION_TIMEOUT_ERROR_MESSAGE;

export const receiveExpectedMessage = async (
    apiRead: CommonProps['apiRead'],
    thpState: ThpState,
    signal?: AbortSignal,
    timeout?: number,
): Promise<ReceiveResult | ReceiveExpectedMessageError> => {
    // scheduleAction returns wrapped error from the apiRead or throws error from itself (timeout, deadline, signal)
    const receiveResult = await scheduleAction(
        attemptSignal => receive(() => apiRead(attemptSignal), protocolV2),
        {
            signal,
            graceful: true,
            timeout,
        },
    ).catch(e =>
        error({
            code: e.message as ScheduleActionError,
        }),
    );

    if (!receiveResult.success) {
        // apiRead received gibberish for example continuation packet or empty data
        if (receiveResult.error.code === PROTOCOL_MALFORMED) {
            return error({ code: 'UnexpectedChunk' });
        }

        if (receiveResult.error.code === SCHEDULE_ACTION_TIMEOUT_ERROR_MESSAGE) {
            return error({ code: 'Timeout' });
        }

        return receiveResult as ReceiveError;
    }

    const encodedMessage = receiveResult.payload;
    const thpHeader = protocolThp.readThpHeader(encodedMessage.header);

    const isExpectedChannel = thpHeader.channel.compare(thpState.channel) === 0;
    if (!isExpectedChannel) {
        return error({ code: 'UnexpectedChannel' });
    }

    try {
        protocolThp.validateCrc(encodedMessage);
    } catch {
        return error({ code: 'UnexpectedCRC' });
    }

    if (encodedMessage.messageType === THP_CONTROL_BYTE.ERROR) {
        return receiveResult;
    }

    if (encodedMessage.messageType === THP_CONTROL_BYTE.ACK_MESSAGE) {
        return receiveResult;
    }

    const isExpectedCtrlByte = thpState.expectedResponses.find(
        m => m === encodedMessage.messageType,
    );

    if (!isExpectedCtrlByte) {
        if (isRecentMessage(receiveResult, thpState)) {
            return error({ code: 'UnexpectedRecentMessage' });
        }

        return error({ code: 'UnexpectedMessage' });
    }

    if (thpHeader.sequenceBit !== thpState.recvBit) {
        if (isRecentMessage(receiveResult, thpState)) {
            return error({ code: 'UnexpectedRecentMessage' });
        }

        return error({ code: 'UnexpectedRecvBit' });
    }

    return receiveResult;
};
