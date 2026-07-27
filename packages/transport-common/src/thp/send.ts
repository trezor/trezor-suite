import { THP_STATE_ERROR } from '../errors';
import { thpLoop } from './loop';
import type { CommonProps } from './receiveExpectedMessage';
import { error, success } from '../utils/result';

export const sendThpMessage = async ({
    thpState,
    chunks,
    apiWrite,
    apiRead,
    signal,
    logger,
    skipAck,
}: CommonProps) => {
    if (!thpState) {
        return error({ code: THP_STATE_ERROR, message: 'ThpStateMissing' });
    }

    const result = await thpLoop({
        chunks,
        thpState,
        apiWrite,
        apiRead,
        signal,
        logger,
        skipAck,
        sendOnly: true,
    });

    return result && !result.success ? result : success(undefined);
};
