import {
    goToNextStep,
    goToSubStep,
    goToStep,
    goToPreviousStep,
    selectTrezorModel,
    setAsNewDevice,
} from '@suite/actions/onboarding/onboardingActions';

import { Step, AnyStepId } from '@suite/types/onboarding/steps';

export interface OnboardingReducer {
    selectedModel: number | null;
    activeStepId: AnyStepId;
    activeSubStep: string | null;
    asNewDevice: boolean | null;
    steps: Step[];
}

export interface OnboardingActions {
    goToNextStep: typeof goToNextStep;
    goToSubStep: typeof goToSubStep;
    goToStep: typeof goToStep;
    goToPreviousStep: typeof goToPreviousStep;
    selectTrezorModel: typeof selectTrezorModel;
    setAsNewDevice: typeof setAsNewDevice;
}

export const GO_TO_SUBSTEP = '@onboarding/go-to-substep';
export const SET_STEP_ACTIVE = '@onboarding/set-step-active';
export const SET_STEP_RESOLVED = '@onboarding/set-step-resolved';
export const SELECT_TREZOR_MODEL = '@onboarding/select-trezor-model';
export const SET_AS_NEW_DEVICE = '@onboarding/set-as-new-device';

interface SetStepActiveAction {
    type: typeof SET_STEP_ACTIVE;
    stepId: AnyStepId; // ? null ?
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

interface SetAsNewDevice {
    type: typeof SET_AS_NEW_DEVICE;
    asNewDevice: boolean;
}

export type OnboardingActionTypes =
    | SetStepActiveAction
    | SetStepResolvedAction
    | GoToSubstepAction
    | SelectTrezorModelAction
    | SetAsNewDevice;
