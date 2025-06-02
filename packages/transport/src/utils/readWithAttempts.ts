import { scheduleAction } from '@trezor/utils';

import { success } from './result';
import { AbstractApi } from '../api/abstract';

type Receiver = (attemptSignal?: AbortSignal) => ReturnType<AbstractApi['read']>;

const ATTEMPT_ERROR = 'Unexpected chunk';

async function readAndAssert<T extends Receiver>(
    receiver: T,
    expectedHeaders?: Buffer[],
    attemptSignal?: AbortSignal,
): ReturnType<AbstractApi['read']> {
    // read one packet
    const chunk = await receiver(attemptSignal);
    if (!chunk.success) {
        return chunk;
    }

    // if no expectedHeaders are set then each chunk is expected
    if (!expectedHeaders) {
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
        return success(chunk.payload);
    }

    // throw error to break scheduleAction attempt
    // and handle it in scheduleAction attemptFailureHandler below
    throw new Error(ATTEMPT_ERROR);
}

// AbstractApi['read'] wrapper
// returns: (expectedHeaders: Buffer[]) => ReturnType<AbstractApi['read']>
// read until received chunk contains expected header and ignore other chunks
export function readWithAttempts<T extends Receiver>(
    receiver: T,
    options?: {
        signal?: AbortSignal;
        attempts?: number;
        timeout?: number;
    },
) {
    return (expectedHeaders?: Buffer[]) =>
        scheduleAction(attemptSignal => readAndAssert(receiver, expectedHeaders, attemptSignal), {
            signal: options?.signal,
            attempts: options?.attempts || Infinity,
            timeout: options?.timeout,
            attemptFailureHandler: e => {
                if (e.message !== ATTEMPT_ERROR) {
                    // stop scheduleAction attempts on any other error
                    return e;
                }
            },
        });
}
