import { MiddlewareAPI } from 'redux';

import { DEVICE } from '@trezor/connect';
import { notificationsActions, removeAccountEventsThunk } from '@suite-common/toast-notifications';
import { accountsActions } from '@suite-common/wallet-core';

import { SUITE } from 'src/actions/suite/constants';
import * as deviceUtils from 'src/utils/suite/device';
import { AppState, Action, Dispatch } from 'src/types/suite';
import { selectDevices, selectDevice } from 'src/reducers/suite/deviceReducer';

/*
 * Middleware for event notifications.
 * Catch certain actions and store them in notifications reducer
 */

const eventsMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        const prevState = api.getState();
        // pass action
        next(action);

        if (action.type === SUITE.APP_CHANGED && prevState.router.app === 'notifications') {
            // Leaving notification app. Mark all unseen notifications as seen
            api.dispatch(notificationsActions.resetUnseen());
        }

        if (action.type === DEVICE.CONNECT || action.type === DEVICE.CONNECT_UNACQUIRED) {
            // get TrezorDevice from @trezor/connect:Device object
            const devices = selectDevices(api.getState());
            const device = devices.find(d => d.path === action.payload.path);
            if (!device) return action; // this shouldn't happen
            const seen = deviceUtils.isSelectedDevice(action.payload, selectDevice(api.getState()));

            const toRemove = api
                .getState()
                .notifications.filter(
                    n => n.type === DEVICE.CONNECT_UNACQUIRED && device.path === n.device.path,
                );
            if (toRemove.length > 0) api.dispatch(notificationsActions.remove(toRemove));

            if (!device.features) {
                // unacquired message
                api.dispatch(
                    notificationsActions.addEvent({
                        type: DEVICE.CONNECT_UNACQUIRED,
                        seen,
                        device,
                    }),
                );
            } else if (!device.remember) {
                api.dispatch(notificationsActions.addEvent({ type: DEVICE.CONNECT, seen, device }));
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
                api.dispatch(notificationsActions.resetUnseen(notifications));
            }
        }

        if (action.type === DEVICE.DISCONNECT || action.type === SUITE.FORGET_DEVICE) {
            // remove notifications associated with disconnected device
            // api.dispatch(addEvent({ type: 'disconnected-device' }));
            const { notifications } = api.getState();
            const devices = selectDevices(prevState);
            const affectedDevices =
                action.type === SUITE.FORGET_DEVICE
                    ? devices.filter(
                          d =>
                              d.path === action.payload.path &&
                              d.instance === action.payload.instance,
                      )
                    : devices.filter(d => d.path === action.payload.path);
            affectedDevices.forEach(d => {
                if (!d.remember) {
                    const toRemove = notifications.filter(n =>
                        d.features
                            ? deviceUtils.isSelectedInstance(d, n.device)
                            : deviceUtils.isSelectedDevice(d, n.device),
                    );
                    api.dispatch(notificationsActions.remove(toRemove));
                }
            });
        }

        if (accountsActions.removeAccount.match(action)) {
            action.payload.forEach(account => {
                api.dispatch(removeAccountEventsThunk(account.descriptor));
            });
        }

        switch (action.type) {
            // Example event: wallet creation
            case SUITE.AUTH_DEVICE:
                api.dispatch(notificationsActions.addEvent({ type: action.type, seen: true }));
                break;
            // no default
        }
        return action;
    };

export default eventsMiddleware;
