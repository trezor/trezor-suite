import { MiddlewareAPI } from 'redux';

import { notificationsActions, ToastPayload } from '@suite-common/toast-notifications';
import { PROTOCOL } from '@suite-actions/constants';

import type { AppState, Action, Dispatch } from '@suite-types';

// close custom protocol notification of given type
const closeNotifications = (api: MiddlewareAPI<Dispatch, AppState>, type: ToastPayload['type']) => {
    api.getState()
        .notifications.filter(notification => notification.type === type && !notification.closed)
        .forEach(protocolNotification =>
            api.dispatch(notificationsActions.close(protocolNotification.id)),
        );
};

const protocolMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        next(action);

        switch (action.type) {
            case PROTOCOL.SAVE_COIN_PROTOCOL:
                closeNotifications(api, 'coin-scheme-protocol');
                break;
            default:
                break;
        }

        return action;
    };

export default protocolMiddleware;
