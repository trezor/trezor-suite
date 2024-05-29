import { thp as protocolThp, v2 as protocolV2 } from '@trezor/protocol';
import { scheduleAction } from '@trezor/utils';

import type { ReceiveThpMessageProps } from './receive';
import { error, success } from '../utils/result';
import { sendChunks } from '../utils/send';

export type SendThpMessageProps = Omit<ReceiveThpMessageProps, 'apiChunkSize'> & {
    chunks: Buffer[];
};

export const sendThpMessage = async ({
    thpState,
    chunks,
    apiWrite,
    apiRead,
    signal,
    logger,
}: SendThpMessageProps) => {
    if (!thpState) {
        return error({ error: 'ThpStateMissing' });
    }

    const expectedResponses = protocolThp.getExpectedResponses(chunks[0]);
    const isAckExpected = protocolThp.isAckExpected(chunks[0]);
    // ThpAck is not expected. just set expectedResponses and continue
    if (!isAckExpected) {
        const sendResult = await sendChunks(chunks, apiWrite);
        if (!sendResult.success) {
            return sendResult;
        }
        thpState.setExpectedResponses(expectedResponses);

        return sendResult;
    }

    // ThpAck is expected.
    // set expectedResponses to ThpAck
    // thpState.setExpectedResponses([protocolThp.constants.THP_CONTINUATION_PACKET]);
    thpState.setExpectedResponses([0x20]); // TODO: export it from thp package

    let attempt = 0;

    // create sequence of scheduled actions controlled by one AbortSignal (from Transport call/send)
    // 1. send message
    // 2. try to read ThpAck/ThpError with deadline/timeout
    // if ThpAck is not received  try to send and read again
    try {
        const result = await scheduleAction(
            async attemptSignal => {
                logger?.log(`sendThpMessage attempt ${attempt} start`);
                const sendResult = await sendChunks(chunks, apiWrite);
                logger?.log(`sendThpMessage success: ${sendResult.success}`);
                if (!sendResult.success) {
                    return sendResult;
                }
                logger?.log(`sendThpMessage read ThpAck start`);

                // read until ThpAck or ThpError
                return scheduleAction(() => apiRead(protocolThp.getExpectedHeaders(thpState)), {
                    signal: attemptSignal,
                    deadline: Date.now() + 3000,
                });
            },
            {
                signal,
                attempts: 3,
                attemptFailureHandler: e => {
                    if (e.message !== 'Aborted by deadline') {
                        // break attempts on unexpected errors
                        return e;
                    }
                    attempt++;
                    logger?.debug(`sendThpMessage retransmission ${attempt} start`);
                },
            },
        );

        if (!result.success) {
            logger?.log('sendThpMessage error', result);

            return result;
        }

        // parse and check the result
        const decodedResult = protocolThp.decodeSendAck(protocolV2.decode(result.payload));
        // fail on ThpError
        if (decodedResult.type === 'ThpError') {
            const { code, message } = decodedResult.message;

            return error({ error: code, message });
        }

        logger?.log('sendThpMessage success', decodedResult);
        // prepare expectedResponses for receiveThpMessage
        thpState.setExpectedResponses(expectedResponses);

        return success(undefined);
    } catch (e) {
        logger?.log('sendThpMessage failure', attempt, error);

        return error({ error: e.code, message: e.message });
    }
};
