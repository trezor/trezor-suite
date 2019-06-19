import { MiddlewareAPI } from 'redux';
import { State, Action, Dispatch } from '@suite-types/index';

const firstMiddleware = (_api: MiddlewareAPI<Dispatch, State>) => (next: Dispatch) => (
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
