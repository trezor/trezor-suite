import { MiddlewareAPI } from 'redux';
import { toast } from 'react-toastify';
import { NOTIFICATION } from '@suite-actions/constants';
import { close } from '@suite-actions/notificationActions';
import { getContent } from '@suite-components/ToastNotification';
import { AppState, Action, Dispatch } from '@suite-types';

/*
 * Middleware for toast notifications.
 * Catch NOTIFICATION.ADD action, get content component and call react-toastify
 */

export default (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    // pass action
    next(action);

    if (action.type !== NOTIFICATION.ADD) return action;

    const { payload } = action;
    toast(getContent(payload, api.dispatch), {
        position: 'bottom-center',
        toastId: payload.id,
        onClose: () => api.dispatch(close(payload.id)),
        closeButton: false,
    });
    return action;
};
