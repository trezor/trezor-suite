import { MiddlewareAPI } from 'redux';

import { firmwareActions } from '@suite-common/firmware';

import * as onboardingActions from 'src/actions/onboarding/onboardingActions';
import { SUITE } from 'src/actions/suite/constants';
import { Action, AppState, Dispatch } from 'src/types/suite';

const onboardingMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        const isFwInstallationDone =
            firmwareActions.setStatus.match(action) && action.payload === 'done';

        if (
            isFwInstallationDone &&
            api.getState().onboarding.isActive &&
            api.getState().firmware.status === 'thp-pairing'
        ) {
            // After the THP pairing is finished we want to jump to the next step automatically.
            // User already drifted away from the installation flow and is not aware that THP is actually in the middle
            // of the Firmware installation.
            api.dispatch(onboardingActions.goToNextStep());
            api.dispatch(firmwareActions.resetReducer());
        } else {
            // pass action
            next(action);
        }

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
