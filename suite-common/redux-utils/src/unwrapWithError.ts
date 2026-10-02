import { type SerializedError } from '@reduxjs/toolkit';

const isSerializedError = (error: unknown): error is SerializedError & { message: string } =>
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string';

const toError = (error: unknown): Error => {
    if (error instanceof Error) {
        return error;
    }

    if (isSerializedError(error)) {
        const rebuiltError = new Error(error.message);

        if (error.name) {
            rebuiltError.name = error.name;
        }
        if (error.stack) {
            rebuiltError.stack = error.stack;
        }

        return rebuiltError;
    }

    return new Error(String(error));
};

// `unwrap()` rejects with a plain `SerializedError` object instead of the original `Error`,
// which breaks `instanceof Error` checks and Sentry reporting.
export const unwrapWithError = async <TResult>(thunkPromise: {
    unwrap: () => Promise<TResult>;
}): Promise<TResult> => {
    try {
        return await thunkPromise.unwrap();
    } catch (error) {
        throw toError(error);
    }
};
