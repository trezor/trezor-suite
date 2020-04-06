import { MiddlewareAPI } from 'redux';
import { SUITE } from '@suite-actions/constants';
import * as recoveryActions from '@recovery-actions/recoveryActions';
import * as onboardingActions from '@onboarding-actions/onboardingActions';

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
    // this applies to recovery when device is not initialized yet -> it means in oboarding.
    // user might lose connection with device and/or reload suite. but the device is still
    // in recovery mode and without any seed so we must act. the way out this is to reinitialize
    // recoveryDevice call and move user to the onboarding step where it should be solved.
    if (action.type === SUITE.SELECT_DEVICE && action.payload?.features?.recovery_mode) {
        if (!action.payload.features.initialized) {
            // enter appropriate onboarding step
            api.dispatch(onboardingActions.goToNextStep('recovery'));
            // also add users selection of 'recovery' path artificially. thats because user
            // might click back and we need to make sure that he will through steps in correct order.
            api.dispatch(onboardingActions.addPath('recovery'));
            // reinitialize recoveryDevice call.
            api.dispatch(recoveryActions.recoverDevice());
        }
        if (action.payload.features.initialized) {
            // if device is initialized then user got interrupted in dry_drun
            api.dispatch(recoveryActions.checkSeed());
        }
    }

    return action;
};
export default recovery;
