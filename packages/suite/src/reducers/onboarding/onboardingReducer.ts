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
    // activeStepId: STEP.ID_RECOVERY_STEP,
    activeStepId: STEP.ID_WELCOME_STEP,

    activeSubStep: null,
    asNewDevice: null,
    path: [STEP.PATH_CREATE, STEP.PATH_RECOVERY],
};

const onboarding = (state: OnboardingReducer = initialState, action: OnboardingActionTypes) => {
    return produce(state, draft => {
        switch (action.type) {
            case SET_STEP_ACTIVE:
                draft.activeStepId = action.stepId;
                draft.activeSubStep = null;
                break;
            // todo: not sure about resolved steps, maybe will not be used
            // case SET_STEP_RESOLVED:
            //     draft.steps = state.steps.map((step: Step) => {
            //         if (step.id === action.stepId) {
            //             return {
            //                 ...step,
            //                 ...{ resolved: true },
            //             };
            //         }
            //         return step;
            //     });
            //     break;
            case GO_TO_SUBSTEP:
                draft.activeSubStep = action.subStepId;
                break;
            case SELECT_TREZOR_MODEL:
                draft.selectedModel = action.model;
                break;
            case SET_PATH:
                draft.path = action.value;
                break;
            default:
                return state;
        }
    });
};

export default onboarding;
