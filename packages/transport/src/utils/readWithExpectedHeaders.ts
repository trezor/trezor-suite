import { PROTOCOL_MALFORMED, thp as protocolThp, v2 as protocolV2 } from '@trezor/protocol';
import { scheduleAction } from '@trezor/utils';

import { receive } from './receive';
// import { success } from './result';
import { AbstractApi } from '../api/abstract';
import { Logger } from '../types';

type ReadWithExpectedHeadersOptions = {
    thpState: protocolThp.ThpState;
    apiRead: (attemptSignal?: AbortSignal) => ReturnType<AbstractApi['read']>;
    signal?: AbortSignal;
    attempts?: number;
    timeout?: number;
    logger?: Logger;
    graceful?: boolean;
};

const ATTEMPT_ERROR = 'Unexpected chunk';

export async function readAndAssert({
    thpState,
    apiRead,
    signal,
    logger,
}: ReadWithExpectedHeadersOptions) {
    // try to read whole message
    const message = await receive(() => apiRead(signal), protocolV2);
    if (!message.success) {
        if (message.error === PROTOCOL_MALFORMED) {
            throw new Error(ATTEMPT_ERROR);
        }

        return message;
    }

    const encodedMessage = message.payload;
    const expectedHeaders = thpState ? protocolThp.getExpectedHeaders(thpState) : [];
    // if there are no expectedHeaders are set then each chunk is expected
    if (expectedHeaders.length === 0) {
        logger?.debug('readAndAssert skip');

        return message;
    }

    const bytes = encodedMessage.header;
    const expected = expectedHeaders.find(
        header =>
            header.length <= bytes.length && bytes.subarray(0, header.length).compare(header) === 0,
    );

    if (expected) {
        logger?.debug('readAndAssert done');

        return message;
    }

    logger?.warn(`readAndAssert unexpected header`);
    // for detailed debugging purposes
    // logger?.warn(
    //     bytes.subarray(0, 3).toString('hex'),
    //     'not match',
    //     expectedHeaders.map(b => b.toString('hex')).join(','),
    // );

    // throw error to break scheduleAction attempt
    // and handle it in scheduleAction attemptFailureHandler below
    throw new Error(ATTEMPT_ERROR);
}

// AbstractApi['read'] wrapper
// returns function: (expectedHeaders: Buffer[]) => ReturnType<AbstractApi['read']>
// read until received chunk contains expected header and ignore other chunks
export function readWithExpectedHeaders(options: ReadWithExpectedHeadersOptions) {
    return (signal?: AbortSignal) =>
        scheduleAction(attemptSignal => readAndAssert({ ...options, signal: attemptSignal }), {
            signal: signal ?? options?.signal,
            graceful: options?.graceful,
            attempts: options?.attempts || Infinity,
            timeout: options?.timeout,
            attemptFailureHandler: error => {
                if (error.message !== ATTEMPT_ERROR) {
                    options.logger?.debug(`readAndAssert attempt error ${error.message}`);

                    // stop scheduleAction attempts on any other error
                    return error;
                }
            },
        });
}
