import { MiddlewareAPI } from 'redux';
import { AppState, Action, Dispatch } from '@suite-types/index';
import { SUITE } from '@suite-actions/constants';
import { resetOnboarding } from '@onboarding-actions/onboardingActions';
import { lockRouter, initialRunCompleted } from '@suite-actions/suiteActions';

const onboardingMiddleware = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    // pass action
    next(action);
    // console.log(action);
    // const prevState = api.getState();

    if (action.type === SUITE.APP_CHANGE && action.payload === 'onboarding') {
        console.log('action in middleware', action);

        api.dispatch(resetOnboarding());

        api.dispatch(lockRouter(true));

        // TODO: maybe more fine grained, after user does something? I will see.
        api.dispatch(initialRunCompleted());
    }

    return action;
};

export default onboardingMiddleware;
