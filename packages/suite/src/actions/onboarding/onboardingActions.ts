import { OnboardingAnalytics } from '@trezor/suite-analytics';
import TrezorConnect from '@trezor/connect';
import { selectDevice } from '@suite-common/wallet-core';

import { ONBOARDING } from 'src/actions/onboarding/constants';
import * as STEP from 'src/constants/onboarding/steps';
import { AnyStepId, AnyPath } from 'src/types/onboarding';
import steps from 'src/config/onboarding/steps';
import { findNextStep, findPrevStep, isStepUsed } from 'src/utils/onboarding/steps';
import { GetState, Dispatch } from 'src/types/suite';
import { DeviceTutorialStatus } from 'src/reducers/onboarding/onboardingReducer';

export type OnboardingAction =
    | {
          type: typeof ONBOARDING.ENABLE_ONBOARDING_REDUCER;
          payload: boolean;
      }
    | {
          type: typeof ONBOARDING.RESET_ONBOARDING;
      }
    | {
          type: typeof ONBOARDING.REMOVE_PATH;
          payload: AnyPath[];
      }
    | {
          type: typeof ONBOARDING.ADD_PATH;
          payload: AnyPath;
      }
    | {
          type: typeof ONBOARDING.SET_STEP_ACTIVE;
          stepId: AnyStepId;
      }
    | {
          type: typeof ONBOARDING.ANALYTICS;
          payload: Partial<OnboardingAnalytics>;
      }
    | {
          type: typeof ONBOARDING.SET_TUTORIAL_STATUS;
          payload: DeviceTutorialStatus;
      };

const goToStep = (stepId: AnyStepId): OnboardingAction => ({
    type: ONBOARDING.SET_STEP_ACTIVE,
    stepId,
});

const addPath = (payload: AnyPath): OnboardingAction => ({
    type: ONBOARDING.ADD_PATH,
    payload,
});

const removePath = (payload: AnyPath[]): OnboardingAction => ({
    type: ONBOARDING.REMOVE_PATH,
    payload,
});

const goToNextStep = (stepId?: AnyStepId) => (dispatch: Dispatch, getState: GetState) => {
    if (stepId) {
        return dispatch(goToStep(stepId));
    }

    const stepsInPath = steps.filter(step => isStepUsed(step, getState));

    const nextStep = findNextStep(getState().onboarding.activeStepId, stepsInPath);
    dispatch(goToStep(nextStep.id));
};

const goToPreviousStep = (stepId?: AnyStepId) => (dispatch: Dispatch, getState: GetState) => {
    if (stepId) {
        return dispatch(goToStep(stepId));
    }

    const stepsInPath = steps.filter(step => isStepUsed(step, getState));

    const prevStep = findPrevStep(getState().onboarding.activeStepId, stepsInPath);
    // steps listed in case statements contain path decisions, so we need
    // to remove saved paths from reducers to let user change it again.
    switch (prevStep.id) {
        case STEP.ID_CREATE_OR_RECOVER:
            dispatch(removePath([STEP.PATH_CREATE, STEP.PATH_RECOVERY]));
            break;
        default:
        // nothing
    }

    dispatch(goToStep(prevStep.id));
};

/**
 * Set onboarding reducer to initial state.
 */
const resetOnboarding = (): OnboardingAction => ({
    type: ONBOARDING.RESET_ONBOARDING,
});

/**
 * Make onboarding reducer listen to actions.
 * @param payload,
 */

const enableOnboardingReducer = (payload: boolean): OnboardingAction => ({
    type: ONBOARDING.ENABLE_ONBOARDING_REDUCER,
    payload,
});

const updateAnalytics = (payload: Partial<OnboardingAnalytics>): OnboardingAction => ({
    type: ONBOARDING.ANALYTICS,
    payload,
});

const setDeviceTutorialStatus = (status: DeviceTutorialStatus): OnboardingAction => ({
    type: ONBOARDING.SET_TUTORIAL_STATUS,
    payload: status,
});

const beginOnboardingTutorial = () => async (dispatch: Dispatch, getState: GetState) => {
    const device = selectDevice(getState());
    if (!device) return;

    dispatch(setDeviceTutorialStatus('active'));

    const { success } = await TrezorConnect.showDeviceTutorial({ device });

    if (success) {
        dispatch(setDeviceTutorialStatus('completed'));
    } else {
        dispatch(setDeviceTutorialStatus('cancelled'));
    }
};

export {
    enableOnboardingReducer,
    goToNextStep,
    goToStep,
    goToPreviousStep,
    addPath,
    removePath,
    resetOnboarding,
    updateAnalytics,
    setDeviceTutorialStatus,
    beginOnboardingTutorial,
};
