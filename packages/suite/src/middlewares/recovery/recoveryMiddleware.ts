import { MiddlewareAPI } from 'redux';
import { SUITE } from '@suite-actions/constants';
import * as recoveryActions from '@recovery-actions/recoveryActions';

import { AppState, Action, Dispatch } from '@suite-types';

const recovery = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    if (
        action.type === SUITE.APP_CHANGED &&
        (action.payload === 'recovery' || action.payload === 'onboarding')
    ) {
        api.dispatch(recoveryActions.resetReducer());
    }

    // pass action
    next(action);

    return action;
};
export default recovery;
