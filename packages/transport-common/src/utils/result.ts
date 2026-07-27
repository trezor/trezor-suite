import { type Ok, type Result, err, ok } from '@trezor/type-utils';

import { UNEXPECTED_ERROR } from '../errors';
import type { TransportError } from '../types';

// The ok() factory returns Result<T, never> which is structurally Ok<T> but TS
// does not narrow the union automatically, so we assert.
export const success = <T>(payload: T): Ok<T> => ok(payload) as Ok<T>;

export const error = <E extends string>({
    code,
    message,
}: {
    code: E;
    message?: string;
}): Result<never, TransportError<E>> => err({ code, message });

export const unknownError = <E extends string = never>(
    thrownError: Error,
    expectedErrors: E[] = [],
) => {
    const expectedErr = expectedErrors.find(eE => eE === thrownError.message);
    if (expectedErr) {
        return error({ code: expectedErr });
    }

    return error({ code: UNEXPECTED_ERROR, message: thrownError.message });
};
