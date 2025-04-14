import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { UI } from '@trezor/connect';

import { connectPopupActions } from './connectPopupActions';

export const prepareConnectPopupMiddleware = createMiddlewareWithExtraDeps(
    async (action, { dispatch, next, extra }) => {
        await next(action);

        if (connectPopupActions.requestPermissions.match(action)) {
            dispatch(extra.actions.openModal({ type: 'connect-popup' }));
        }
        if (connectPopupActions.confirmAddresses.match(action)) {
            dispatch(extra.actions.openModal({ type: 'connect-address-confirmation' }));
        }
        if (
            connectPopupActions.initiateCall.match(action) ||
            connectPopupActions.approvePermissions.match(action)
        ) {
            dispatch(extra.actions.openModal({ type: 'connect-loading' }));
        }
        if (connectPopupActions.setError.match(action)) {
            dispatch(extra.actions.openModal({ type: 'connect-error' }));
        }
        if (
            connectPopupActions.finishCall.match(action) ||
            connectPopupActions.rejectPermissions.match(action)
        ) {
            dispatch(extra.actions.onModalCancel());
        }
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
