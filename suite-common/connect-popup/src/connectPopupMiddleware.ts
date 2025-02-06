import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';

import { connectPopupActions } from './connectPopupActions';

export const prepareConnectPopupMiddleware = createMiddlewareWithExtraDeps(
    async (action, { dispatch, next, extra }) => {
        await next(action);

        if (connectPopupActions.initiateCall.match(action)) {
            dispatch(extra.actions.openModal({ type: 'connect-popup' }));
        }
        if (
            connectPopupActions.approveCall.match(action) ||
            connectPopupActions.rejectCall.match(action)
        ) {
            dispatch(extra.actions.onModalCancel());
        }

        return action;
    },
);
