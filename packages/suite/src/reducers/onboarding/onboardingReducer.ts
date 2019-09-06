import produce from 'immer';
import { DEVICE } from 'trezor-connect';

import {
    OnboardingReducer,
    SET_STEP_ACTIVE,
    GO_TO_SUBSTEP,
    SELECT_TREZOR_MODEL,
    ADD_PATH,
    REMOVE_PATH,
} from '@suite/types/onboarding/onboarding';
import { AnyPath } from '@onboarding-types/steps';
import * as STEP from '@suite/constants/onboarding/steps';
import steps from '@onboarding-config/steps';
import { Action } from '@suite-types';

const initialState: OnboardingReducer = {
    prevDeviceId: null,
    selectedModel: null,
    activeStepId: STEP.ID_WELCOME_STEP,
    activeSubStep: null,
    path: [],
};

const setPrevDeviceId = (state: OnboardingReducer, device: any) => {
    // dont set prevDeviceId if we are in steps that dont care about it.
    const activeStep = steps.find(s => s.id === state.activeStepId);
    if (
        activeStep &&
        activeStep.disallowedDeviceStates &&
        !activeStep.disallowedDeviceStates.includes(STEP.DISALLOWED_IS_NOT_SAME_DEVICE)
    ) {
        return null;
    }

    // unacquired device
    if (!device.features) {
        return null;
    }
    if (!state.prevDeviceId) {
        return device.features.device_id;
    }
    if (state.prevDeviceId !== device.features.device_id) {
        return state.prevDeviceId;
    }
    return device.features.device_id;
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

const onboarding = (state: OnboardingReducer = initialState, action: Action) => {
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
            case DEVICE.DISCONNECT:
                draft.prevDeviceId = setPrevDeviceId(state, action.payload);
                break;
            default:
        }
    });
};

export default onboarding;
