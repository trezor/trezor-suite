import { thp as protocolThp } from '@trezor/protocol';
import { THP_CONTROL_BYTE } from '@trezor/protocol/src/protocol-v2/constants';

import {
    ATTEMPTS_LIMIT,
    type CommonProps,
    THP_ACK_DEADLINE,
    THP_ACK_TIMEOUT,
    receiveExpectedMessage,
} from './receiveExpectedMessage';
import { THP_STATE_ERROR } from '../errors';
import { error } from '../utils/result';
import { sendChunks } from '../utils/send';

type ThpLoopProps = CommonProps & {
    thpState: NonNullable<CommonProps['thpState']>;
    sendOnly?: boolean;
    receiveOnly?: boolean;
};

enum ThpLoopState {
    WRITE_REQUEST,
    READ_ACK,
    READ_RESPONSE,
    SEND_ACK,
    SEND_RECENT_ACK,
    // VERIFY_ACK, // TODO verify that SEND_ACK was successful and device is not sending anything
    DONE,
}

export const thpLoop = async ({
    chunks,
    thpState,
    apiWrite,
    apiRead,
    signal,
    logger,
    skipAck,
    sendOnly,
    receiveOnly,
}: ThpLoopProps) => {
    const caller =
        (sendOnly && 'sendThpMessage') || (receiveOnly && 'receiveThpMessage') || 'callThpMessage';
    const debug = logger ? (msg: string) => logger.debug(`${caller} ${msg}`) : () => {};

    let phase = receiveOnly ? ThpLoopState.READ_RESPONSE : ThpLoopState.WRITE_REQUEST;
    let writeAttempt = 0;
    let readAttempt = 0;
    const deadline = Date.now() + THP_ACK_DEADLINE;
    const isDeadlineReached = () => Date.now() >= deadline;
    const thpStateError = (message: string) => error({ error: THP_STATE_ERROR, message });
    let result;

    while (phase !== ThpLoopState.DONE) {
        switch (phase) {
            case ThpLoopState.WRITE_REQUEST: {
                debug(`WRITE_REQUEST attempt ${writeAttempt}`);

                if (++writeAttempt > ATTEMPTS_LIMIT) {
                    return thpStateError('RetriesExceeded');
                }

                if (isDeadlineReached()) {
                    return thpStateError('Aborted by deadline');
                }

                const sendResult = await sendChunks(chunks, apiWrite);
                debug(`WRITE_REQUEST success: ${sendResult.success}`);
                if (!sendResult.success) {
                    return sendResult;
                }

                if (!sendOnly) {
                    const expectedResponses = protocolThp.getExpectedResponses(chunks[0]);
                    thpState.setExpectedResponses(expectedResponses);
                }

                const isAckExpected = !skipAck && protocolThp.isAckExpected(chunks[0]);
                if (isAckExpected) {
                    phase = ThpLoopState.READ_ACK;
                } else if (sendOnly) {
                    phase = ThpLoopState.DONE;
                } else {
                    phase = ThpLoopState.READ_RESPONSE;
                }
                break;
            }

            case ThpLoopState.READ_ACK: {
                debug(`READ_ACK`);

                if (isDeadlineReached()) {
                    phase = ThpLoopState.WRITE_REQUEST;
                    break;
                }

                const ackResult = await receiveExpectedMessage(
                    apiRead,
                    thpState,
                    signal,
                    THP_ACK_TIMEOUT,
                );
                if (!ackResult.success) {
                    switch (ackResult.error.code) {
                        case 'UnexpectedChunk':
                            break; // keep reading
                        case 'UnexpectedCRC':
                            return thpStateError(ackResult.error.code);
                        case 'UnexpectedChannel':
                            break; // keep reading. TODO: try to close unknown channel
                        case 'UnexpectedRecentMessage':
                            phase = ThpLoopState.SEND_RECENT_ACK;
                            break;
                        case 'Timeout':
                        case 'UnexpectedMessage':
                        case 'UnexpectedRecvBit':
                            phase = ThpLoopState.WRITE_REQUEST;
                            break;

                        default:
                            return ackResult;
                    }

                    break;
                }

                if (sendOnly) {
                    phase = ThpLoopState.DONE;
                    break;
                }

                switch (ackResult.payload.messageType) {
                    case THP_CONTROL_BYTE.ACK_MESSAGE: {
                        const { ackBit } = protocolThp.readThpHeader(ackResult.payload.header);
                        if (ackBit === thpState.sendAckBit) {
                            phase = ThpLoopState.READ_RESPONSE;
                        } else {
                            debug(`READ_ACK unexpected ThpAck bit`);
                        }

                        break;
                    }
                    case THP_CONTROL_BYTE.ERROR:
                        result = ackResult;
                        phase = ThpLoopState.DONE;
                        break;
                    default:
                        debug(`READ_ACK received response`);
                        result = ackResult;
                        phase = ThpLoopState.SEND_ACK;
                        break;
                }

                break;
            }

            case ThpLoopState.READ_RESPONSE: {
                debug(`READ_RESPONSE`);

                if (++readAttempt > ATTEMPTS_LIMIT) {
                    return thpStateError('RetriesExceeded');
                }

                const receiveResult = await receiveExpectedMessage(apiRead, thpState, signal);
                if (!receiveResult.success) {
                    switch (receiveResult.error.code) {
                        case 'UnexpectedChunk':
                            break; // keep reading
                        case 'UnexpectedCRC':
                            return thpStateError(receiveResult.error.code);
                        case 'UnexpectedChannel':
                            break; // keep reading. TODO: try to close unknown channel
                        case 'UnexpectedRecentMessage':
                            if (receiveOnly) {
                                phase = ThpLoopState.SEND_RECENT_ACK;
                                break;
                            } else {
                                return thpStateError(receiveResult.error.code);
                            }
                        case 'Timeout': // NOTE: timeout should never happen here as receiveExpectedMessage doesn't use it
                        case 'UnexpectedMessage':
                        case 'UnexpectedRecvBit':
                            return thpStateError(receiveResult.error.code);
                        default:
                            return receiveResult;
                    }

                    break;
                }

                switch (receiveResult.payload.messageType) {
                    case THP_CONTROL_BYTE.ACK_MESSAGE:
                        break; // keep reading
                    case THP_CONTROL_BYTE.ERROR:
                        result = receiveResult;
                        phase = ThpLoopState.DONE;
                        break;
                    default:
                        result = receiveResult;
                        phase = ThpLoopState.SEND_ACK;
                        break;
                }

                break;
            }

            case ThpLoopState.SEND_RECENT_ACK: {
                debug('SEND_RECENT_ACK');

                const prevState = new protocolThp.ThpState();
                prevState.deserialize({ ...thpState.serialize() });
                prevState.updateAckBit('recv'); // downgrade ackBit

                const chunk = protocolThp.encodeAck(prevState);
                const ackResult = await apiWrite(chunk, signal);
                if (!ackResult.success) {
                    return ackResult;
                }

                if (receiveOnly) {
                    phase = ThpLoopState.READ_RESPONSE;
                } else {
                    phase = ThpLoopState.WRITE_REQUEST;
                }
                break;
            }

            case ThpLoopState.SEND_ACK: {
                const isAckExpected = protocolThp.isAckExpected(thpState.expectedResponses || []);
                debug(`SEND_ACK ${isAckExpected}`);

                if (!skipAck && isAckExpected) {
                    const ack = await apiWrite(protocolThp.encodeAck(thpState), signal);
                    if (!ack.success) {
                        return ack;
                    }
                }

                if (result) {
                    thpState.setRecentMessage(protocolThp.getCRC(result.payload));
                }

                phase = ThpLoopState.DONE;
                break;
            }
        }
    }

    return result;
};
