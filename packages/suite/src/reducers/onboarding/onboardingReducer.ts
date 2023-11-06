import produce from 'immer';
import { DEVICE, Device } from '@trezor/connect';
import { OnboardingAnalytics } from '@trezor/suite-analytics';

import { ONBOARDING } from 'src/actions/onboarding/constants';
import * as STEP from 'src/constants/onboarding/steps';
import { Action } from 'src/types/suite';

import type { AnyStepId, AnyPath } from 'src/types/onboarding';

export interface OnboardingRootState {
    onboarding: OnboardingState;
}

export type DeviceTutorialStatus = 'active' | 'completed' | 'cancelled' | null;

export interface OnboardingState {
    isActive: boolean;
    prevDevice: Device | null;
    activeStepId: AnyStepId;
    path: AnyPath[];
    onboardingAnalytics: Partial<OnboardingAnalytics>;
    tutorialStatus: DeviceTutorialStatus;
}

const initialState: OnboardingState = {
    isActive: false,
    // todo: prevDevice is now used to solve two different things and it cant work
    // would be better to implement field "isMatchingPrevDevice" along with prevDevice
    // prevDevice is used only in firmwareUpdate so maybe move it to firmwareUpdate
    // and here leave only isMatchingPrevDevice ?

    prevDevice: null,
    activeStepId: STEP.ID_FIRMWARE_STEP,
    path: [],
    onboardingAnalytics: {},
    tutorialStatus: null,
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
        !state.isActive &&
        ![ONBOARDING.RESET_ONBOARDING, ONBOARDING.ENABLE_ONBOARDING_REDUCER].includes(action.type)
    ) {
        return state;
    }

    return produce(state, draft => {
        switch (action.type) {
            case ONBOARDING.ENABLE_ONBOARDING_REDUCER:
                draft.isActive = action.payload;
                break;
            case ONBOARDING.SET_STEP_ACTIVE:
                draft.activeStepId = action.stepId;
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
            case ONBOARDING.ANALYTICS:
                draft.onboardingAnalytics = { ...state.onboardingAnalytics, ...action.payload };
                break;
            case ONBOARDING.SET_TUTORIAL_STATUS:
                draft.tutorialStatus = action.payload;
                break;

            case ONBOARDING.RESET_ONBOARDING:
                return initialState;
            //  no default
        }
    });
};

export const selectOnboardingTutorialStatus = (state: OnboardingRootState) =>
    state.onboarding.tutorialStatus;

export const selectIsOnboadingActive = (state: OnboardingRootState) => state.onboarding.isActive;

export default onboarding;
