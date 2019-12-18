import TrezorConnect from 'trezor-connect';
import { MiddlewareAPI } from 'redux';
import { SUITE } from '@suite-actions/constants';
import * as onboardingActions from '@onboarding-actions/onboardingActions';
import * as suiteActions from '@suite-actions/suiteActions';
import { isWebUSB } from '@suite-utils/device';
import { AppState, Action, Dispatch } from '@suite-types';

const onboardingMiddleware = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    const prevApp = api.getState().router.app;
    // pass action
    next(action);

    if (action.type === SUITE.APP_CHANGED) {
        // here middleware detects that onboarding app is loaded, do following:
        //  1. make reducer to accept actions (enableReducer) and apply changes
        //  2. lock router if not locked yet (disable browser navigation)
        if (action.payload === 'onboarding') {
            api.dispatch(onboardingActions.enableOnboardingReducer(true));
            api.dispatch(suiteActions.lockRouter(true));
        }

        // here middleware detects that onboarding app is disposed, do following:
        // 1. reset onboarding reducer to initialState
        // 2. set initialRun field in suite reducer to false (do not redirect to onboarding on first load next time)
        if (action.payload !== 'onboarding' && prevApp === 'onboarding') {
            api.dispatch(onboardingActions.resetOnboarding());
            api.dispatch(suiteActions.initialRunCompleted());
        }
    }

    // consider turning of webusb in moment user selects he is using a new device and it is model One.
    const { path, selectedModel } = api.getState().onboarding;
    const { transport } = api.getState().suite;
    if (path.includes('new') && selectedModel === 1 && isWebUSB(transport)) {
        TrezorConnect.disableWebUSB();
    }

    return action;
};

export default onboardingMiddleware;
