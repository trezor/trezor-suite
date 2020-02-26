import { MiddlewareAPI } from 'redux';
import { toast } from 'react-toastify';
import { NOTIFICATION } from '@suite-actions/constants';
import { close } from '@suite-actions/notificationActions';
import { getContent } from '@suite-components/ToastNotification';
import { AppState, Action, Dispatch } from '@suite-types';

/*
 * Middleware for toast notifications.
 * This middleware should be used only in browser environment (web/desktop)
 * Catch NOTIFICATION.TOAST action, get content component and call `react-toastify.toast`
 */

export default (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    // pass action
    next(action);

    if (action.type !== NOTIFICATION.TOAST) return action;

    const { payload } = action;
    toast(getContent(payload, api.dispatch), {
        position: 'bottom-center',
        toastId: payload.id,
        onClose: () => api.dispatch(close(payload.id)),
        closeButton: false,
    });
    return action;
};
