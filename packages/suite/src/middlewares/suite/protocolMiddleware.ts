import { MiddlewareAPI } from 'redux';

import { close } from '@suite-actions/notificationActions';
import { PROTOCOL } from '@suite-actions/constants';

import type { AppState, Action, Dispatch } from '@suite-types';

const protocolMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        next(action);

        if (action.type === PROTOCOL.SAVE_COIN_PROTOCOL) {
            // close current custom protocol notification
            api.getState()
                .notifications.filter(
                    notification =>
                        notification.type === 'coin-scheme-protocol' && !notification.closed,
                )
                .forEach(protocolNotification => api.dispatch(close(protocolNotification.id)));
        }

        return action;
    };

export default protocolMiddleware;
