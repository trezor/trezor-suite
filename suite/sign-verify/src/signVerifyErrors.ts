import { type ErrorCode, type SerializedError } from '@trezor/connect-common/src/constants/errors';

const CANCEL_ERROR_CODES: ErrorCode[] = ['Method_Cancel', 'Failure_ActionCancelled'];

export const isCancelledError = ({ code }: SerializedError) => CANCEL_ERROR_CODES.includes(code);

export const getFailureAttributes = (error: SerializedError) => ({
    status: isCancelledError(error) ? ('cancelled' as const) : ('error' as const),
    error: error.code,
});

export const asError = (error: unknown) =>
    error instanceof Error ? error : new Error(String(error));
