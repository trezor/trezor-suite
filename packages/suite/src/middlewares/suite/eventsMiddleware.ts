import { MiddlewareAPI } from 'redux';
import { SUITE } from '@suite-actions/constants';
import { addEvent, resetUnseen } from '@suite-actions/notificationActions';
import { AppState, Action, Dispatch } from '@suite-types';

/*
 * Middleware for event notifications.
 * Catch certain actions and store them in notifications reducer
 */

export default (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    const prevState = api.getState();
    // pass action
    next(action);

    if (action.type === SUITE.APP_CHANGED && prevState.router.app === 'notifications') {
        // Leaving notification app. Mark all unseen notifications as seen
        api.dispatch(resetUnseen());
    }

    switch (action.type) {
        // Example event: wallet creation
        case SUITE.AUTH_DEVICE:
            api.dispatch(addEvent({ type: action.type, seen: true }));
            break;
        // no default
    }
    return action;
};
