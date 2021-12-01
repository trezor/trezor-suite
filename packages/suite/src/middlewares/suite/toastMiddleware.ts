import { MiddlewareAPI } from 'redux';
import { toast } from 'react-toastify';
import { NOTIFICATION } from '@suite-actions/constants';
import { close } from '@suite-actions/notificationActions';
import { renderToast } from '@suite-components/ToastNotification';
import { AppState, Action, Dispatch } from '@suite-types';

/*
 * Middleware for toast notifications.
 * This middleware should be used only in browser environment (web/desktop)
 * Catch NOTIFICATION.TOAST action, get content component and call `react-toastify.toast`
 */

const toastMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        // pass action
        next(action);

        if (action.type === NOTIFICATION.CLOSE) {
            // we are using custom close button that dispatch this action
            toast.dismiss(action.payload);
        }

        if (action.type === NOTIFICATION.TOAST) {
            const payload = { ...action.payload };
            // assetType error is returned by trezor-connect
            // we don't want to show this generic message in toast however the whole message is useful for logging
            // redact error message to empty string
            if (payload.error && payload.error.indexOf('assetType:') >= 0) {
                payload.error = '';
            }
            toast(renderToast(payload), {
                toastId: payload.id,
                onClose: () => api.dispatch(close(payload.id)),
                // if 'autoclose' is not set, close notifications after 5s
                autoClose: payload.autoClose ?? 5000,
            });
        }

        return action;
    };

export default toastMiddleware;
