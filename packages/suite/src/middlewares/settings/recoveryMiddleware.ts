import { MiddlewareAPI } from 'redux';
import { SUITE } from '@suite-actions/constants';
import * as recoveryActions from '@settings-actions/recoveryActions';
import { AppState, Action, Dispatch } from '@suite-types';

const recoveryMiddleware = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    // pass action
    next(action);

    // just reset recoveryReducer when user enters 'check-seed' app
    if (action.type === SUITE.APP_CHANGED && action.payload === 'check-seed') {
        api.dispatch(recoveryActions.resetReducer());
    }
    return action;
};

export default recoveryMiddleware;
