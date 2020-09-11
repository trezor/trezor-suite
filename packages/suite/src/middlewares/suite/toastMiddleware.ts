import { MiddlewareAPI } from 'redux';
import { toast } from 'react-toastify';
import { NOTIFICATION } from '@suite-actions/constants';
import { close } from '@suite-actions/notificationActions';
import ToastNotification from '@suite-components/ToastNotification';
import hocNotification from '@suite-components/hocNotification';
import { AppState, Action, Dispatch } from '@suite-types';

/*
 * Middleware for toast notifications.
 * This middleware should be used only in browser environment (web/desktop)
 * Catch NOTIFICATION.TOAST action, get content component and call `react-toastify.toast`
 */

const toastMiddleware = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    // pass action
    next(action);

    if (action.type !== NOTIFICATION.TOAST) return action;

    // TODO: set custom timeout
    const { payload } = action;
    toast(hocNotification(payload, ToastNotification), {
        position: 'bottom-center',
        toastId: payload.id,
        onClose: () => api.dispatch(close(payload.id)),
        closeButton: false,
        hideProgressBar: true,
    });
    return action;
};

export default toastMiddleware;
