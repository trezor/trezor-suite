import { AnyAction } from '@reduxjs/toolkit';
import { produce } from 'immer';

import { type OnboardingAnalytics } from '@suite/analytics';
import { type BackupType } from '@suite-common/suite-types';
import { DEVICE } from '@trezor/connect';

import * as ONBOARDING from './onboardingConstants';
import * as STEP from './onboardingSteps';
import { type AnyPath, type AnyStepId } from './types';

export interface OnboardingRootState {
    onboarding: OnboardingState;
}

export interface OnboardingState {
    backupType: BackupType;
    isActive: boolean;
    prevDeviceId: string | null;
    activeStepId: AnyStepId;
    path: AnyPath[];
    onboardingAnalytics: Partial<OnboardingAnalytics>;
}

const initialState: OnboardingState = {
    isActive: false,
    // todo: prevDevice is now used to solve two different things and it cant work
    // would be better to implement field "isMatchingPrevDevice" along with prevDevice
    // prevDevice is used only in firmwareUpdate so maybe move it to firmwareUpdate
    // and here leave only isMatchingPrevDevice ?

    prevDeviceId: null,
    activeStepId: STEP.ID_FIRMWARE_STEP,
    path: [],
    onboardingAnalytics: {},
    backupType: 'shamir-single',
};

const addPath = (path: AnyPath, state: OnboardingState) => {
    if (!state.path.includes(path)) {
        return [...state.path, path];
    }

    return [...state.path];
};

const removePath = (paths: AnyPath[], state: OnboardingState) =>
    state.path.filter(p => !paths.includes(p));

const ALLOWED_ACTION_TYPES = new Set<string>([
    ONBOARDING.RESET_ONBOARDING,
    ONBOARDING.ENABLE_ONBOARDING_REDUCER,
    ONBOARDING.ANALYTICS,
]);

export const onboardingReducer = (state: OnboardingState = initialState, action: AnyAction) => {
    if (!state.isActive && !ALLOWED_ACTION_TYPES.has(action.type)) {
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
                draft.prevDeviceId = action.payload.id ?? null;
                break;
            case ONBOARDING.ANALYTICS:
                draft.onboardingAnalytics = { ...state.onboardingAnalytics, ...action.payload };
                break;
            case ONBOARDING.SELECT_BACKUP_TYPE:
                draft.backupType = action.payload;
                break;

            case ONBOARDING.RESET_ONBOARDING:
                return initialState;
            //  no default
        }
    });
};

export const selectIsOnboardingActive = (state: OnboardingRootState) => state.onboarding.isActive;

export const selectOnboardingAnalytics = (state: OnboardingRootState) =>
    state.onboarding.onboardingAnalytics;

