import { THP_STATE_ERROR } from '../errors';
import { thpLoop } from './loop';
import type { CommonProps } from './receiveExpectedMessage';
import { error } from '../utils/result';

export const callThpMessage = async ({
    thpState,
    chunks,
    apiWrite,
    apiRead,
    signal,
    logger,
}: CommonProps) => {
    if (!thpState) {
        return error({ error: THP_STATE_ERROR, message: 'ThpStateMissing' });
    }

    const result = await thpLoop({ chunks, thpState, apiWrite, apiRead, signal, logger });

    // NOTE: result should never be empty
    return result ?? error({ error: THP_STATE_ERROR, message: 'MissingResponse' });
};
