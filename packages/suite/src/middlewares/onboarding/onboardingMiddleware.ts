import { MiddlewareAPI } from 'redux';
import { SUITE } from 'src/actions/suite/constants';
import * as onboardingActions from 'src/actions/onboarding/onboardingActions';
import { firmwareActions } from 'src/actions/firmware/firmwareActions';
import { AppState, Action, Dispatch } from 'src/types/suite';
import { selectDevice } from 'src/reducers/suite/suiteReducer';
import { DeviceModelInternal } from '@trezor/connect';

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

        // initiate on-device tutorial after firmware installation
        if (action.type === firmwareActions.setStatus.type && action.payload === 'done') {
            const device = selectDevice(api.getState());

            if (device?.features?.internal_model === DeviceModelInternal.T2B1) {
                api.dispatch(onboardingActions.beginOnbordingTutorial());
            }
        }

        return action;
    };

export default onboardingMiddleware;
