import { thp as protocolThp, v2 as protocolV2 } from '@trezor/protocol';
import { scheduleAction } from '@trezor/utils';

import { THP_STATE_ERROR } from '../errors';
import type { ReceiveThpMessageProps } from './receive';
import { readWithExpectedHeaders } from '../utils/readWithExpectedHeaders';
import { error, success } from '../utils/result';
import { sendChunks } from '../utils/send';

export type SendThpMessageProps = Omit<ReceiveThpMessageProps, 'apiChunkSize'> & {
    chunks: Buffer[];
};

const ATTEMPTS_LIMIT = 10;
const THP_ACK_DEADLINE = 30_000;

export const sendThpMessage = async ({
    thpState,
    skipAck,
    chunks,
    apiWrite,
    apiRead,
    signal,
    graceful,
    logger,
}: SendThpMessageProps) => {
    if (!thpState) {
        return error({ error: THP_STATE_ERROR, message: 'ThpStateMissing' });
    }

    const expectedResponses = protocolThp.getExpectedResponses(chunks[0]);
    const isAckExpected = protocolThp.isAckExpected(chunks[0]);
    // ThpAck is not expected. just set expectedResponses and continue
    if (skipAck || !isAckExpected || expectedResponses.length === 0) {
        const sendResult = await sendChunks(chunks, apiWrite);
        if (!sendResult.success) {
            return sendResult;
        }
        thpState.setExpectedResponses(expectedResponses);

        return sendResult;
    }

    // ThpAck is expected.
    // set expectedResponses to ThpAck
    thpState.setExpectedResponses([0x20]); // THP_READ_ACK_HEADER_BYTE

    let attempt = 0;

    const apiReadWithExpectedHeaders = readWithExpectedHeaders(apiRead, {
        signal,
        graceful,
        logger,
    });

    // create sequence of scheduled actions controlled by one AbortSignal (from Transport call/send)
    // 1. send message
    // 2. try to read ThpAck/ThpError with deadline/timeout
    // if ThpAck is not received try to send and read again
    try {
        const result = await scheduleAction(
            async attemptSignal => {
                logger?.debug(`sendThpMessage attempt ${attempt} start`);
                const sendResult = await sendChunks(chunks, apiWrite);
                logger?.debug(`sendThpMessage success: ${sendResult.success}`);
                if (!sendResult.success) {
                    return sendResult;
                }
                logger?.debug(`sendThpMessage read ThpAck`);

                // read until ThpAck or ThpError
                return scheduleAction(signal => apiReadWithExpectedHeaders(thpState, signal), {
                    signal: attemptSignal,
                    graceful,
                    deadline: Date.now() + THP_ACK_DEADLINE,
                });
            },
            {
                signal,
                attempts: ATTEMPTS_LIMIT,
                attemptFailureHandler: error => {
                    if (error.message !== 'Aborted by deadline') {
                        logger?.error(`sendThpMessage error ${error.message}`);

                        // break attempts on unexpected errors
                        return error;
                    }
                    attempt++;
                    logger?.debug(`sendThpMessage retransmission ${attempt} start`);
                },
            },
        );

        if (!result.success) {
            return result;
        }

        // parse and check the result
        const decodedResult = protocolThp.decodeSendAck(protocolV2.decode(result.payload));
        // fail on ThpError
        if (decodedResult?.type === 'ThpError') {
            const { code, message } = decodedResult.message;

            return error({ error: code, message });
        }

        logger?.debug('sendThpMessage done');
        // set expectedResponses as they will be used in receiveThpMessage
        thpState.setExpectedResponses(expectedResponses);

        return success(undefined);
    } catch (err) {
        logger?.error(`sendThpMessage error ${err.message}`);

        return error({ error: err.code, message: err.message });
    }
};
