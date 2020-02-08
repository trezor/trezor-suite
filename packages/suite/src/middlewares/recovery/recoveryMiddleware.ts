import { MiddlewareAPI } from 'redux';
import { SUITE } from '@suite-actions/constants';
import * as recoveryActions from '@recovery-actions/recoveryActions';
import { AppState, Action, Dispatch } from '@suite-types';

const recovery = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    const prevApp = api.getState().router.app;
    // pass action
    next(action);
    if (action.type === SUITE.APP_CHANGED && (prevApp === 'recovery' || prevApp === 'onboarding')) {
        api.dispatch(recoveryActions.resetReducer());
    }

    return action;
};
export default recovery;
