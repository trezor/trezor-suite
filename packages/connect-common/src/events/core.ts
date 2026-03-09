import { ErrorCode, SerializedError, TrezorError } from '../constants/errors';

export const createErrorMessage = (
    error: (Error & { code?: ErrorCode }) | TrezorError,
): { success: false; error: SerializedError } => ({
    success: false,
    error: {
        message: error.message,
        code: (error as TrezorError).code ?? 'Failure_UnknownCode',
    },
});
