import { MiddlewareAPI } from 'redux';
import { SUITE } from '@suite-actions/constants';
import { resetOnboarding, enableOnboardingReducer } from '@onboarding-actions/onboardingActions';
import { lockRouter, initialRunCompleted } from '@suite-actions/suiteActions';
import { AppState, Action, Dispatch } from '@suite-types';

const onboardingMiddleware = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    // pass action
    next(action);

    if (action.type === SUITE.APP_CHANGE && action.payload === 'onboarding') {
        api.dispatch(lockRouter(true));
        api.dispatch(enableOnboardingReducer(true));
    }

    const { onboarding } = api.getState();

    if (
        action.type === SUITE.APP_CHANGE &&
        action.payload !== 'onboarding' &&
        onboarding.reducerEnabled
    ) {
        // resetOnboarding also sets enableReducer to false;
        api.dispatch(resetOnboarding());
        api.dispatch(lockRouter(false));

        // TODO: maybe more fine grained, after user does something? I will see.
        api.dispatch(initialRunCompleted());
    }

    return action;
};

export default onboardingMiddleware;
