import { type Dispatch } from 'redux';

import { type EventInstance, type events } from '@suite-common/analytics';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type ErrorCode, type SerializedError } from '@trezor/connect-common/src/constants/errors';

export const CANCEL_ERROR_CODES: ErrorCode[] = ['Method_Cancel', 'Failure_ActionCancelled'];

export const getFailureAttributes = ({
    code,
}: SerializedError): Pick<
    EventInstance<typeof events.coinSignMessageEvent>['payload'],
    'status' | 'error'
> => ({
    status: CANCEL_ERROR_CODES.includes(code) ? ('cancelled' as const) : ('error' as const),
    error: code,
});

export const asError = (error: unknown) =>
    error instanceof Error ? error : new Error(String(error));

export const onError =
    (dispatch: Dispatch, type: 'sign-message-error' | 'verify-message-error') => (error: Error) => {
        dispatch(
            notificationsActions.addToast({
                type,
                error: error.message,
            }),
        );

        return false as const;
    };
