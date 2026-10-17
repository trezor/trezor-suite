import { type ERRORS } from '@trezor/connect-common';

const CANCEL_ERROR_CODES: ERRORS.ErrorCode[] = ['Method_Cancel', 'Failure_ActionCancelled'];

export const isCancelledError = ({ code }: ERRORS.SerializedError) =>
    CANCEL_ERROR_CODES.includes(code);

export const getFailureAttributes = (error: ERRORS.SerializedError) => ({
    status: isCancelledError(error) ? ('cancelled' as const) : ('error' as const),
    error: error.code,
});

export const asError = (error: unknown) =>
    error instanceof Error ? error : new Error(String(error));
