import produce from 'immer';

import {
    OnboardingReducer,
    OnboardingActionTypes,
    SET_STEP_ACTIVE,
    GO_TO_SUBSTEP,
    SELECT_TREZOR_MODEL,
    ADD_PATH,
    REMOVE_PATH,
} from '@suite/types/onboarding/onboarding';
import { AnyPath } from '@onboarding-types/steps';
import * as STEP from '@suite/constants/onboarding/steps';

const initialState: OnboardingReducer = {
    selectedModel: null,
    activeStepId: STEP.ID_WELCOME_STEP,
    activeSubStep: null,
    path: [],
};

const addPath = (path: AnyPath, state: OnboardingReducer) => {
    if (!state.path.includes(path)) {
        return [...state.path, path];
    }
    return [...state.path];
};

const removePath = (paths: AnyPath[], state: OnboardingReducer) => {
    return state.path.filter(p => !paths.includes(p));
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
            case ADD_PATH:
                draft.path = addPath(action.value, state);
                break;
            case REMOVE_PATH:
                draft.path = removePath(action.value, state);
                break;
            default:
        }
    });
};

export default onboarding;
