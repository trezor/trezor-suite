import { MiddlewareAPI } from 'redux';
import { DEVICE } from 'trezor-connect';
import { SUITE } from '@suite-actions/constants';
import { TRANSACTION, ACCOUNT } from '@wallet-actions/constants';
import * as notificationActions from '@suite-actions/notificationActions';
import * as deviceUtils from '@suite-utils/device';
import { AppState, Action, Dispatch } from '@suite-types';

/*
 * Middleware for event notifications.
 * Catch certain actions and store them in notifications reducer
 */

const eventsMiddleware = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    const prevState = api.getState();
    // pass action
    next(action);

    if (action.type === SUITE.APP_CHANGED && prevState.router.app === 'notifications') {
        // Leaving notification app. Mark all unseen notifications as seen
        api.dispatch(notificationActions.resetUnseen());
    }

    if (action.type === DEVICE.CONNECT || action.type === DEVICE.CONNECT_UNACQUIRED) {
        // get TrezorDevice from trezor-connect:Device object
        const device = api.getState().devices.find(d => d.path === action.payload.path);
        if (!device) return action; // this shouldn't happen
        const seen = deviceUtils.isSelectedDevice(action.payload, api.getState().suite.device);

        const toRemove = api
            .getState()
            .notifications.filter(
                n => n.type === DEVICE.CONNECT_UNACQUIRED && device.path === n.device.path,
            );
        if (toRemove.length > 0) api.dispatch(notificationActions.remove(toRemove));

        if (!device.features) {
            // unacquired message
            api.dispatch(
                notificationActions.addEvent({ type: DEVICE.CONNECT_UNACQUIRED, seen, device }),
            );
        } else if (!device.remember) {
            api.dispatch(notificationActions.addEvent({ type: DEVICE.CONNECT, seen, device }));
        }
    }

    if (action.type === SUITE.SELECT_DEVICE) {
        // Find and mark all notification associated (new connected!, update required etc)
        if (!action.payload) return action;
        const notifications = api
            .getState()
            .notifications.filter(
                n =>
                    n.type === DEVICE.CONNECT &&
                    !n.seen &&
                    deviceUtils.isSelectedDevice(action.payload, n.device),
            );
        if (notifications.length > 0) {
            api.dispatch(notificationActions.resetUnseen(notifications));
        }
    }

    if (action.type === DEVICE.DISCONNECT) {
        // remove notifications associated with disconnected device
        // api.dispatch(addEvent({ type: 'disconnected-device' }));
        const { notifications } = api.getState();
        const affectedDevices = prevState.devices.filter(d => d.path === action.payload.path);
        affectedDevices.forEach(d => {
            if (!d.remember) {
                const toRemove = notifications.filter(n =>
                    d.features
                        ? deviceUtils.isSelectedInstance(d, n.device)
                        : deviceUtils.isSelectedDevice(d, n.device),
                );
                api.dispatch(notificationActions.remove(toRemove));
            }
        });
    }

    if (action.type === TRANSACTION.REMOVE) {
        api.dispatch(notificationActions.removeTransactionEvents(action.txs));
    }

    if (action.type === ACCOUNT.REMOVE) {
        action.payload.forEach(account => {
            api.dispatch(notificationActions.removeAccountEvents(account.descriptor));
        });
    }

    switch (action.type) {
        // Example event: wallet creation
        case SUITE.AUTH_DEVICE:
            api.dispatch(notificationActions.addEvent({ type: action.type, seen: true }));
            break;
        // no default
    }
    return action;
};

export default eventsMiddleware;
