import produce from 'immer';
import { DEVICE, Device } from 'trezor-connect';

import { ONBOARDING } from '@onboarding-actions/constants';
import * as STEP from '@onboarding-constants/steps';
import { Action } from '@suite-types';
import { AnyStepId, AnyPath } from '@onboarding-types';

export interface OnboardingState {
    reducerEnabled: boolean;
    prevDevice: Device | null;
    activeStepId: AnyStepId;
    activeSubStep: string | null;
    path: AnyPath[];
}

const initialState: OnboardingState = {
    reducerEnabled: false,
    // todo: prevDevice is now used to solve two different things and it cant work
    // would be better to implement field "isMatchingPrevDevice" along with prevDevice
    // prevDevice is used only in firmwareUpdate so maybe move it to firmwareUpdate
    // and here leave only isMatchingPrevDevice ?
    prevDevice: null,
    activeStepId: STEP.ID_WELCOME_STEP,
    activeSubStep: null,
    path: [],
};

const addPath = (path: AnyPath, state: OnboardingState) => {
    if (!state.path.includes(path)) {
        return [...state.path, path];
    }
    return [...state.path];
};

const removePath = (paths: AnyPath[], state: OnboardingState) =>
    state.path.filter(p => !paths.includes(p));

const onboarding = (state: OnboardingState = initialState, action: Action) => {
    if (
        !state.reducerEnabled &&
        ![ONBOARDING.RESET_ONBOARDING, ONBOARDING.ENABLE_ONBOARDING_REDUCER].includes(action.type)
    ) {
        return state;
    }

    return produce(state, draft => {
        switch (action.type) {
            case ONBOARDING.ENABLE_ONBOARDING_REDUCER:
                draft.reducerEnabled = action.payload;
                break;
            case ONBOARDING.SET_STEP_ACTIVE:
                draft.activeStepId = action.stepId;
                draft.activeSubStep = null;
                break;
            case ONBOARDING.GO_TO_SUBSTEP:
                draft.activeSubStep = action.subStepId;
                break;
            case ONBOARDING.ADD_PATH:
                draft.path = addPath(action.payload, state);
                break;
            case ONBOARDING.REMOVE_PATH:
                draft.path = removePath(action.payload, state);
                break;
            case DEVICE.DISCONNECT:
                draft.prevDevice = action.payload;
                break;
            case ONBOARDING.RESET_ONBOARDING:
                return initialState;
            //  no default
        }
    });
};

export default onboarding;
