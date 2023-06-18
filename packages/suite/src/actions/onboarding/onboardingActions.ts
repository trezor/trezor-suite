import { OnboardingAnalytics } from '@trezor/suite-analytics';

import { ONBOARDING } from 'src/actions/onboarding/constants';
import * as STEP from 'src/constants/onboarding/steps';
import { AnyStepId, AnyPath } from 'src/types/onboarding';
import steps from 'src/config/onboarding/steps';
import { findNextStep, findPrevStep, isStepInPath } from 'src/utils/onboarding/steps';

import { GetState, Dispatch } from 'src/types/suite';

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
          type: typeof ONBOARDING.GO_TO_SUBSTEP;
          subStepId: string | null;
      }
    | {
          type: typeof ONBOARDING.SET_STEP_ACTIVE;
          stepId: AnyStepId;
      }
    | {
          type: typeof ONBOARDING.ANALYTICS;
          payload: Partial<OnboardingAnalytics>;
      };

const goToStep = (stepId: AnyStepId): OnboardingAction => ({
    type: ONBOARDING.SET_STEP_ACTIVE,
    stepId,
});

const goToSubStep = (subStepId: string | null): OnboardingAction => ({
    type: ONBOARDING.GO_TO_SUBSTEP,
    subStepId,
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
    const { activeStepId, path } = getState().onboarding;
    const stepsInPath = steps.filter(step => isStepInPath(step, path));
    const nextStep = findNextStep(activeStepId, stepsInPath);
    dispatch(goToStep(nextStep.id));
};

const goToPreviousStep = (stepId?: AnyStepId) => (dispatch: Dispatch, getState: GetState) => {
    if (stepId) {
        return dispatch(goToStep(stepId));
    }
    const { activeStepId, path } = getState().onboarding;
    const stepsInPath = steps.filter(step => isStepInPath(step, path));
    const prevStep = findPrevStep(activeStepId, stepsInPath);
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

export {
    enableOnboardingReducer,
    goToNextStep,
    goToSubStep,
    goToStep,
    goToPreviousStep,
    addPath,
    removePath,
    resetOnboarding,
    updateAnalytics,
};
