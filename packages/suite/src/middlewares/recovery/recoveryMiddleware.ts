import { MiddlewareAPI } from 'redux';
import { SUITE } from '@suite-actions/constants';
import * as recoveryActions from '@recovery-actions/recoveryActions';
import { AppState, Action, Dispatch } from '@suite-types';

const recovery = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    const { app } = api.getState().router;
    // pass action
    next(action);

    if (action.type === SUITE.APP_CHANGED && (app === 'recovery' || app === 'onboarding')) {
        api.dispatch(recoveryActions.resetReducer());
    }

    return action;
};
export default recovery;
