import { type EventInstance, type events } from '@suite-common/analytics';
import { type ErrorCode, type SerializedError } from '@trezor/connect-common/src/constants/errors';

const CANCEL_ERROR_CODES: ErrorCode[] = ['Method_Cancel', 'Failure_ActionCancelled'];

export const isCancelError = ({ code }: SerializedError) => CANCEL_ERROR_CODES.includes(code);

export const getFailureAttributes = (
    error: SerializedError,
): Pick<EventInstance<typeof events.coinSignMessageEvent>['payload'], 'status' | 'error'> => ({
    status: isCancelError(error) ? ('cancelled' as const) : ('error' as const),
    error: error.code,
});

export const asError = (error: unknown) =>
    error instanceof Error ? error : new Error(String(error));
