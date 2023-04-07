import type { Success } from '../types';
import { UNEXPECTED_ERROR } from '../errors';

export const success = <T>(payload: T): Success<T> => ({
    success: true as const,
    payload,
});

export const error = <E>({ error, message }: { error: E; message?: string }) => ({
    success: false as const,
    error,
    message,
});

export const unknownError = <E>(err: Error, expectedErrors: E[]) => {
    const expectedErr = expectedErrors.find(eE => eE === err.message);
    if (expectedErr) {
        return error({ error: expectedErr });
    }

    return {
        success: false as const,
        error: UNEXPECTED_ERROR,
        message: err.message,
    };
};
