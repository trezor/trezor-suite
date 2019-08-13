import {
    goToNextStep,
    goToSubStep,
    goToStep,
    goToPreviousStep,
    selectTrezorModel,
    addPath,
    removePath,
} from '@suite/actions/onboarding/onboardingActions';

import { AnyStepId, AnyPath } from '@suite/types/onboarding/steps';

export interface OnboardingReducer {
    selectedModel: 1 | 2 | null;
    activeStepId: AnyStepId;
    activeSubStep: string | null;
    path: AnyPath[];
}

export interface OnboardingActions {
    goToNextStep: typeof goToNextStep;
    goToSubStep: typeof goToSubStep;
    goToStep: typeof goToStep;
    goToPreviousStep: typeof goToPreviousStep;
    selectTrezorModel: typeof selectTrezorModel;
    addPath: typeof addPath;
    removePath: typeof removePath;
}

export const GO_TO_SUBSTEP = '@onboarding/go-to-substep';
export const SET_STEP_ACTIVE = '@onboarding/set-step-active';
export const SET_STEP_RESOLVED = '@onboarding/set-step-resolved';
export const SELECT_TREZOR_MODEL = '@onboarding/select-trezor-model';
export const ADD_PATH = '@onboarding/add-path';
export const REMOVE_PATH = '@onboarding/remove-path';

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
    model: 1 | 2;
}

interface AddPath {
    type: typeof ADD_PATH;
    value: AnyPath;
}
interface RemovePath {
    type: typeof REMOVE_PATH;
    value: AnyPath[];
}

export type OnboardingActionTypes =
    | SetStepActiveAction
    | SetStepResolvedAction
    | GoToSubstepAction
    | SelectTrezorModelAction
    | AddPath
    | RemovePath;
