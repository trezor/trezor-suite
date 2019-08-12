import produce from 'immer';

import {
    OnboardingReducer,
    OnboardingActionTypes,
    SET_STEP_ACTIVE,
    // SET_STEP_RESOLVED,
    GO_TO_SUBSTEP,
    SELECT_TREZOR_MODEL,
    SET_PATH,
} from '@suite/types/onboarding/onboarding';
// import { Step } from '@suite/types/onboarding/steps';

import * as STEP from '@suite/constants/onboarding/steps';

const initialState: OnboardingReducer = {
    selectedModel: null,
    activeStepId: STEP.ID_WELCOME_STEP,
    activeSubStep: null,
    asNewDevice: null,
    path: [],
};

const setPath = (newPath: OnboardingReducer['path']) => {
    const updatedPath: OnboardingReducer['path'] = [];
    newPath.forEach(path => {
        if (!updatedPath.includes(path)) {
            updatedPath.push(path);
        }
    });
    return updatedPath;
};

const onboarding = (state: OnboardingReducer = initialState, action: OnboardingActionTypes) => {
    return produce(state, draft => {
        switch (action.type) {
            case SET_STEP_ACTIVE:
                draft.activeStepId = action.stepId;
                draft.activeSubStep = null;
                break;
            case GO_TO_SUBSTEP:
                draft.activeSubStep = action.subStepId;
                break;
            case SELECT_TREZOR_MODEL:
                draft.selectedModel = action.model;
                break;
            case SET_PATH:
                draft.path = setPath(action.value);
                break;
            default:
                return state;
        }
    });
};

export default onboarding;
