import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { UI } from '@trezor/connect';

export const prepareConnectPopupMiddleware = createMiddlewareWithExtraDeps(
    async (action, { dispatch, next }) => {
        await next(action);

        if (action.type === UI.INSUFFICIENT_FUNDS) {
            dispatch(
                notificationsActions.addToast({
                    type: 'not-enough-funds-error',
                }),
            );
        }

        return action;
    },
);
