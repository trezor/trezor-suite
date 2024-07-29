import { scheduleAction } from '@trezor/utils';

import { success } from './result';
import { AbstractApi } from '../api/abstract';
import { Logger } from '../types';

type Receiver = (attemptSignal?: AbortSignal) => ReturnType<AbstractApi['read']>;

type Options = {
    signal?: AbortSignal;
    attempts?: number;
    timeout?: number;
    logger?: Logger;
};

const ATTEMPT_ERROR = 'Unexpected chunk';

async function readAndAssert<T extends Receiver>(
    receiver: T,
    expectedHeaders?: Buffer[],
    { signal, logger }: Options = {},
): ReturnType<AbstractApi['read']> {
    logger?.debug('readAndAssert start');
    // try to read one packet
    const chunk = await receiver(signal);
    if (!chunk.success) {
        return chunk;
    }

    // if there are no expectedHeaders are set then each chunk is expected
    if (!expectedHeaders || expectedHeaders.length === 0) {
        logger?.debug('readAndAssert skip');

        return chunk;
    }

    const bytes = chunk.payload;
    const expected = expectedHeaders.find(header => {
        if (bytes.length < header.length) {
            return false;
        }

        return bytes.subarray(0, header.length).compare(header) === 0 ? true : false;
    });

    if (expected) {
        logger?.debug('readAndAssert done');

        return success(chunk.payload);
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
export function readWithExpectedHeaders<T extends Receiver>(receiver: T, options: Options = {}) {
    return (expectedHeaders?: Buffer[]) =>
        scheduleAction(
            attemptSignal =>
                readAndAssert(receiver, expectedHeaders, { ...options, signal: attemptSignal }),
            {
                signal: options?.signal,
                attempts: options?.attempts || Infinity,
                timeout: options?.timeout,
                attemptFailureHandler: error => {
                    if (error.message !== ATTEMPT_ERROR) {
                        options.logger?.debug(`readAndAssert attempt error ${error.message}`);

                        // stop scheduleAction attempts on any other error
                        return error;
                    }
                },
            },
        );
}
