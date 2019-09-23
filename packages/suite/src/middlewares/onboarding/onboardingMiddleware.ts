import { MiddlewareAPI } from 'redux';
import { SUITE } from '@suite-actions/constants';
import * as onboardingActions from '@onboarding-actions/onboardingActions';
import * as suiteActions from '@suite-actions/suiteActions';
import { AppState, Action, Dispatch } from '@suite-types';

const onboardingMiddleware = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    const prevApp = api.getState().router.app;

    // pass action
    next(action);

    if (action.type === SUITE.APP_CHANGED) {
        if (action.payload === 'onboarding') {
            api.dispatch(onboardingActions.enableOnboardingReducer(true));
            api.dispatch(suiteActions.lockRouter(true));
        }

        if (action.payload !== 'onboarding' && prevApp === 'onboarding') {
            api.dispatch(onboardingActions.resetOnboarding());
            api.dispatch(suiteActions.initialRunCompleted());
        }
    }

    return action;
};

export default onboardingMiddleware;
