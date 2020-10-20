import { ONBOARDING } from '@onboarding-actions/constants';
import * as STEP from '@onboarding-constants/steps';
import { AnyStepId, AnyPath } from '@onboarding-types/steps';
import steps from '@onboarding-config/steps';
import { findNextStep, findPrevStep, isStepInPath } from '@onboarding-utils/steps';

import { GetState, Dispatch } from '@suite-types';

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
          type: typeof ONBOARDING.SELECT_TREZOR_MODEL;
          model: 1 | 2;
      }
    | {
          type: typeof ONBOARDING.GO_TO_SUBSTEP;
          subStepId: string | null;
      }
    | {
          type: typeof ONBOARDING.SET_STEP_RESOLVED;
          stepId: AnyStepId;
      }
    | {
          type: typeof ONBOARDING.SET_STEP_ACTIVE;
          stepId: AnyStepId;
      };

const goToStep = (stepId: AnyStepId): OnboardingAction => ({
    type: ONBOARDING.SET_STEP_ACTIVE,
    stepId,
});

const goToSubStep = (subStepId: string | null): OnboardingAction => ({
    type: ONBOARDING.GO_TO_SUBSTEP,
    subStepId,
});

const selectTrezorModel = (model: 1 | 2): OnboardingAction => ({
    type: ONBOARDING.SELECT_TREZOR_MODEL,
    model,
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
        case STEP.ID_NEW_OR_USED:
            dispatch(removePath([STEP.PATH_NEW, STEP.PATH_USED]));
            break;
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

const callActionAndGoToNextStep = (action: any, stepId?: AnyStepId) => async (
    dispatch: Dispatch,
) => {
    const result = await action();
    if (result.success) {
        dispatch(goToNextStep(stepId));
    }
};

export {
    enableOnboardingReducer,
    goToNextStep,
    goToSubStep,
    goToStep,
    goToPreviousStep,
    selectTrezorModel,
    addPath,
    removePath,
    resetOnboarding,
    callActionAndGoToNextStep,
};
