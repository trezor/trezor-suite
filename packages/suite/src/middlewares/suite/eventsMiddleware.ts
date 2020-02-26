import { MiddlewareAPI } from 'redux';
import { SUITE } from '@suite-actions/constants';
import { addEvent } from '@suite-actions/notificationActions';
import { AppState, Action, Dispatch } from '@suite-types';

/*
 * Middleware for event notifications.
 * Catch certain actions and store them in notifications reducer
 */

export default (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    // pass action
    next(action);

    switch (action.type) {
        // Example event: wallet creation
        case SUITE.AUTH_DEVICE:
            api.dispatch(addEvent({ type: action.type }));
            break;
        // no default
    }
    return action;
};
