import { MiddlewareAPI } from 'redux';

import { SUITE } from 'src/actions/suite/constants';
import * as onboardingActions from 'src/actions/onboarding/onboardingActions';
import { AppState, Action, Dispatch } from 'src/types/suite';

const onboardingMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        // pass action
        next(action);

        if (action.type === SUITE.APP_CHANGED) {
            // here middleware detects that onboarding app is loaded, do following:
            //  1. make reducer to accept actions (enableReducer) and apply changes
            if (action.payload === 'onboarding') {
                api.dispatch(onboardingActions.enableOnboardingReducer(true));
            }
        }

        return action;
    };

export default onboardingMiddleware;
