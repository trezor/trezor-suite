// send with ThpAck

import { thp as protocolThp } from '@trezor/protocol';
import { scheduleAction } from '@trezor/utils';

import { ReceiveThpMessageProps, readWithExpectedState } from './receive';
import { error } from '../utils/result';
import { sendChunks } from '../utils/send';

type SendThpMessageProps = Omit<ReceiveThpMessageProps, 'apiChunkSize'> & {
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
    const expectedResponses = protocolThp.getExpectedResponse(chunks[0]);
    const isAckExpected = protocolThp.isAckExpected(chunks[0]);
    if (!isAckExpected) {
        const sendResult = await sendChunks(chunks, apiWrite);
        if (!sendResult.success) {
            return sendResult;
        }
        thpState?.setExpectedResponse(expectedResponses);

        return sendResult;
    }

    let attempt = 0;
    thpState?.setExpectedResponse([0x20]);

    try {
        const result = await scheduleAction(
            async attemptSignal => {
                logger?.debug(`sendThpMessage attempt ${attempt} start`);
                const sendResult = await sendChunks(chunks, apiWrite);
                logger?.debug(`sendThpMessage success: ${sendResult.success}`);
                if (!sendResult.success) {
                    return sendResult;
                }
                logger?.debug(`sendThpMessage read ThpAck start`);

                return scheduleAction(
                    readSignal => readWithExpectedState(apiRead, thpState, readSignal, logger),
                    {
                        signal: attemptSignal,
                        deadline: Date.now() + 3000,
                    },
                );
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

        logger?.debug('sendThpMessage result', result.success);
        if (result.success) {
            thpState?.updateSyncBit('send');
            thpState?.updateNonce('send');
            thpState?.setExpectedResponse(expectedResponses);
        }

        return result;
    } catch (e) {
        logger?.debug('sendWithRetransmission error', attempt, error);

        return error({ error: e.message });
    }
};
