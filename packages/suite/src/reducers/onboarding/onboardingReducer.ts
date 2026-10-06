import { type UnknownAction } from '@reduxjs/toolkit';
import { produce } from 'immer';

import { type OnboardingAnalytics } from '@suite/analytics';
import { deviceActions } from '@suite-common/device';
import { type BackupType } from '@suite-common/suite-types';

import {
    addPath,
    enableOnboardingReducer,
    goToStep,
    removePath,
    resetOnboarding,
    updateAnalytics,
    updateBackupMedium,
    updateBackupType,
} from 'src/actions/onboarding/onboardingActions';
import * as STEP from 'src/constants/onboarding/steps';
import type { AnyPath, AnyStepId, BackupMedium } from 'src/types/onboarding';

export interface OnboardingRootState {
    onboarding: OnboardingState;
}

export interface OnboardingState {
    backupType: BackupType;
    backupMedium: BackupMedium | null;
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
    backupMedium: null,
};

const addPathToState = (path: AnyPath, state: OnboardingState) => {
    if (!state.path.includes(path)) {
        return [...state.path, path];
    }

    return [...state.path];
};

const removePathsFromState = (paths: AnyPath[], state: OnboardingState) =>
    state.path.filter(p => !paths.includes(p));

const ALLOWED_ACTION_TYPES = new Set<UnknownAction['type']>([
    resetOnboarding.type,
    enableOnboardingReducer.type,
    updateAnalytics.type,
]);

const onboarding = (state: OnboardingState = initialState, action: UnknownAction) => {
    if (!state.isActive && !ALLOWED_ACTION_TYPES.has(action.type)) {
        return state;
    }

    return produce(state, draft => {
        if (enableOnboardingReducer.match(action)) {
            draft.isActive = action.payload;
        } else if (goToStep.match(action)) {
            draft.activeStepId = action.payload;
        } else if (addPath.match(action)) {
            draft.path = addPathToState(action.payload, state);
        } else if (removePath.match(action)) {
            draft.path = removePathsFromState(action.payload, state);
        } else if (deviceActions.deviceDisconnect.match(action)) {
            draft.prevDeviceId = action.payload.id ?? null;
        } else if (updateAnalytics.match(action)) {
            draft.onboardingAnalytics = { ...state.onboardingAnalytics, ...action.payload };
        } else if (updateBackupType.match(action)) {
            draft.backupType = action.payload;
        } else if (updateBackupMedium.match(action)) {
            draft.backupMedium = action.payload;
        } else if (resetOnboarding.match(action)) {
            return initialState;
        }
    });
};

export const selectIsOnboardingActive = (state: OnboardingRootState) => state.onboarding.isActive;

export default onboarding;
