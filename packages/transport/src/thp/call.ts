import { receiveThpMessage } from './receive';
import { SendThpMessageProps, sendThpMessage } from './send';

export const callThpMessage = async ({
    thpState,
    chunks,
    apiWrite,
    apiRead,
    signal,
    logger,
}: SendThpMessageProps) => {
    // send and wait for ThpAck
    const sendResult = await sendThpMessage({
        chunks,
        thpState,
        apiWrite,
        apiRead,
        signal,
        logger,
    });
    if (!sendResult.success) {
        return sendResult;
    }

    // read and send ThpAck
    const receiveResult = await receiveThpMessage({
        thpState,
        apiWrite,
        apiRead,
        signal,
        logger,
    });

    return receiveResult;
};
