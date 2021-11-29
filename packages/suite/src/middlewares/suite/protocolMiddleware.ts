import { MiddlewareAPI } from 'redux';

import { close } from '@suite-actions/notificationActions';
import { PROTOCOL } from '@suite-actions/constants';

import type { AppState, Action, Dispatch } from '@suite-types';
import type { ToastPayload } from '@suite-reducers/notificationReducer';

// close custom protocol notification of given type
const closeNotifications = (api: MiddlewareAPI<Dispatch, AppState>, type: ToastPayload['type']) => {
    api.getState()
        .notifications.filter(notification => notification.type === type && !notification.closed)
        .forEach(protocolNotification => api.dispatch(close(protocolNotification.id)));
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
            case PROTOCOL.SAVE_AOPP_PROTOCOL:
                closeNotifications(api, 'aopp-protocol');
                break;
            default:
                break;
        }

        return action;
    };

export default protocolMiddleware;
