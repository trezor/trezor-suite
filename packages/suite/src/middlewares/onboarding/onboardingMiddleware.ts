import { MiddlewareAPI } from 'redux';
import { SUITE } from '@suite-actions/constants';
import * as onboardingActions from '@onboarding-actions/onboardingActions';
import * as suiteActions from '@suite-actions/suiteActions';
import { AppState, Action, Dispatch } from '@suite-types';

const onboardingMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        const prevApp = api.getState().router.app;
        // pass action
        next(action);

        if (action.type === SUITE.APP_CHANGED) {
            // here middleware detects that onboarding app is loaded, do following:
            //  1. make reducer to accept actions (enableReducer) and apply changes
            if (action.payload === 'onboarding') {
                api.dispatch(onboardingActions.enableOnboardingReducer(true));
            }

            // here middleware detects that onboarding app is disposed, do following:
            // 1. reset onboarding reducer to initialState
            // 2. set initialRun field in suite reducer to false (do not redirect to onboarding on first load next time)
            if (action.payload !== 'onboarding' && prevApp === 'onboarding') {
                api.dispatch(suiteActions.initialRunCompleted());
                api.dispatch(onboardingActions.resetOnboarding());
            }
        }
        return action;
    };

export default onboardingMiddleware;
