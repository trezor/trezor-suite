import {
    goToNextStep,
    goToSubStep,
    goToStep,
    goToPreviousStep,
    selectTrezorModel,
} from '@suite/actions/onboarding/onboardingActions';

import { Step, AnyStepId } from '@suite/types/onboarding/steps';

export interface OnboardingReducer {
    selectedModel: number | null;
    activeStepId: AnyStepId | null;
    activeSubStep: string | null;
    steps: Step[];
}

export interface OnboardingActions {
    goToNextStep: typeof goToNextStep;
    goToSubStep: typeof goToSubStep;
    goToStep: typeof goToStep;
    goToPreviousStep: typeof goToPreviousStep;
    selectTrezorModel: typeof selectTrezorModel;
}

export const GO_TO_SUBSTEP = '@onboarding/go-to-substep';
export const SET_STEP_ACTIVE = '@onboarding/set-step-active';
export const SET_STEP_RESOLVED = '@onboarding/set-step-resolved';
export const SELECT_TREZOR_MODEL = '@onboarding/select-trezor-model';

interface SetStepActiveAction {
    type: typeof SET_STEP_ACTIVE;
    stepId: AnyStepId;
}

interface SetStepResolvedAction {
    type: typeof SET_STEP_RESOLVED;
    stepId: AnyStepId;
}

interface GoToSubstepAction {
    type: typeof GO_TO_SUBSTEP;
    subStepId: string | null;
}

interface SelectTrezorModelAction {
    type: typeof SELECT_TREZOR_MODEL;
    model: number;
}

export type OnboardingActionTypes =
    | SetStepActiveAction
    | SetStepResolvedAction
    | GoToSubstepAction
    | SelectTrezorModelAction;
