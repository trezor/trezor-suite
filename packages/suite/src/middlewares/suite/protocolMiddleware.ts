import { type Dispatch, type UnknownAction } from '@reduxjs/toolkit';
import { type MiddlewareAPI } from 'redux';

import { type ToastPayload, notificationsActions } from '@suite-common/toast-notifications';

import { saveCoinProtocol } from 'src/actions/suite/protocolActions';
import type { AppState } from 'src/types/suite';

// close custom protocol notification of given type
const closeNotifications = (
    api: MiddlewareAPI<Dispatch<UnknownAction>, AppState>,
    type: ToastPayload['type'],
) => {
    api.getState()
        .notifications.filter(notification => notification.type === type && !notification.closed)
        .forEach(protocolNotification =>
            api.dispatch(notificationsActions.close(protocolNotification.id)),
        );
};

const protocolMiddleware =
    (api: MiddlewareAPI<Dispatch<UnknownAction>, AppState>) =>
    (next: Dispatch<UnknownAction>) =>
    (action: UnknownAction): UnknownAction => {
        next(action);

        if (saveCoinProtocol.match(action)) {
            closeNotifications(api, 'coin-scheme-protocol');
        }

        return action;
    };

export default protocolMiddleware;
