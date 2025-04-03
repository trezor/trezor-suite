import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';

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
            connectPopupActions.finishCall.match(action) ||
            connectPopupActions.approvePermissions.match(action) ||
            connectPopupActions.rejectPermissions.match(action)
        ) {
            dispatch(extra.actions.onModalCancel());
        }

        return action;
    },
);
