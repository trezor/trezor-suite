import {
    SET_STEP_ACTIVE,
    GO_TO_SUBSTEP,
    SET_STEP_RESOLVED,
    SELECT_TREZOR_MODEL,
    SET_AS_NEW_DEVICE,
    OnboardingReducer,
} from '@suite/types/onboarding/onboarding';
import { AnyStepId } from '@suite/types/onboarding/steps';
import { GetState, Dispatch } from '@suite/types/onboarding/actions';

// utils
const findNextStep = (currentStep: string, onboardingSteps: OnboardingReducer['steps']) => {
    const currentIndex = onboardingSteps.findIndex(step => step.id === currentStep);
    if (currentIndex + 1 > onboardingSteps.length) {
        throw new Error('no next step exists');
    }
    return onboardingSteps[currentIndex + 1];
};

const findPrevStep = (currentStep: string, onboardingSteps: OnboardingReducer['steps']) => {
    const currentIndex = onboardingSteps.findIndex(step => step.id === currentStep);
    if (currentIndex - 1 > onboardingSteps.length) {
        throw new Error('no next step exists');
    }
    return onboardingSteps[currentIndex - 1];
};

const goToStep = (stepId: AnyStepId | null) => (dispatch: Dispatch) => {
    dispatch({
        type: SET_STEP_ACTIVE,
        stepId,
    });
};

const goToSubStep = (subStepId: string | null) => ({
    type: GO_TO_SUBSTEP,
    subStepId,
});

const goToNextStep = (stepId?: AnyStepId) => (dispatch: Dispatch, getState: GetState) => {
    const { activeStepId, steps } = getState().onboarding;
    const nextStep = findNextStep(activeStepId, steps);
    const activeStep = steps.find(step => step.id === activeStepId);

    if (!activeStep.resolved) {
        dispatch({
            type: SET_STEP_RESOLVED,
            stepId: activeStepId,
        });
    }

    dispatch(goToStep(stepId || nextStep.id));
};

const goToPreviousStep = () => (dispatch: Dispatch, getState: GetState) => {
    const { activeStepId } = getState().onboarding;
    const prevStep = findPrevStep(activeStepId, getState().onboarding.steps);

    dispatch(goToStep(prevStep.id));
};

const selectTrezorModel = (model: number) => ({
    type: SELECT_TREZOR_MODEL,
    model,
});

const setAsNewDevice = (asNewDevice: boolean) => ({
    type: SET_AS_NEW_DEVICE,
    asNewDevice,
});

export { goToNextStep, goToSubStep, goToStep, goToPreviousStep, selectTrezorModel, setAsNewDevice };
