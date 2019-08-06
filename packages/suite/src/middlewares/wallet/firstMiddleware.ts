import { MiddlewareAPI } from 'redux';
import { AppState, Action, Dispatch } from '@suite-types';

const firstMiddleware = (_api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    // pass action
    next(action);

    switch (action.type) {
        default:
            break;
    }
    return action;
};

export default firstMiddleware;
