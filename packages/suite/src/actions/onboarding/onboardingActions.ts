import {
    SET_STEP_ACTIVE,
    GO_TO_SUBSTEP,
    SET_STEP_RESOLVED,
    SELECT_TREZOR_MODEL,
    SET_PATH,
    OnboardingReducer,
} from '@suite/types/onboarding/onboarding';
import { Step } from '@suite/types/onboarding/steps';
import { AnyStepId } from '@onboarding-types/steps';
import steps from '@onboarding-config/steps';
import { findNextStep, findPrevStep, isStepInPath } from '@onboarding-utils/steps';
import { GetState, Dispatch } from '@suite-types';

const goToStep = (stepId: AnyStepId) => (dispatch: Dispatch) => {
    dispatch({
        type: SET_STEP_ACTIVE,
        stepId,
    });
};

const goToSubStep = (subStepId: string | null) => (dispatch: Dispatch) => {
    dispatch({
        type: GO_TO_SUBSTEP,
        subStepId,
    });
};

const goToNextStep = (stepId?: AnyStepId) => (dispatch: Dispatch, getState: GetState) => {
    if (stepId) {
        return dispatch(goToStep(stepId));
    }
    const { activeStepId, path } = getState().onboarding;
    const stepsInPath = steps.filter(step => isStepInPath(step, path));
    const nextStep = findNextStep(activeStepId, stepsInPath);
    const activeStep = steps.find((step: Step) => step.id === activeStepId);

    if (activeStep && !activeStep.resolved) {
        dispatch({
            type: SET_STEP_RESOLVED,
            stepId: activeStepId,
        });
    }

    dispatch(goToStep(nextStep.id));
};

const goToPreviousStep = () => (dispatch: Dispatch, getState: GetState) => {
    const { activeStepId, path } = getState().onboarding;
    const stepsInPath = steps.filter(step => isStepInPath(step, path));
    const prevStep = findPrevStep(activeStepId, stepsInPath);
    dispatch(goToStep(prevStep.id));
};

const selectTrezorModel = (model: number) => ({
    type: SELECT_TREZOR_MODEL,
    model,
});

const setPath = (value: OnboardingReducer['path']) => ({
    type: SET_PATH,
    value,
});

export { goToNextStep, goToSubStep, goToStep, goToPreviousStep, selectTrezorModel, setPath };
