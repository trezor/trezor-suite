import { PayloadAction, createAction, createSlice } from '@reduxjs/toolkit';

import { type OnboardingAnalytics } from '@suite/analytics';
import { type BackupType } from '@suite-common/suite-types';
import { DEVICE } from '@trezor/connect';

import * as STEP from './onboardingSteps';
import { type AnyPath, type AnyStepId } from './types';

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

const deviceDisconnected = createAction<{ id?: string }>(DEVICE.DISCONNECT);

export const onboardingSlice = createSlice({
    name: 'onboarding',
    initialState,
    reducers: {
        enableOnboardingReducer: (state, { payload }: PayloadAction<boolean>) => {
            state.isActive = payload;
        },
        goToOnboardingStep: (state, { payload }: PayloadAction<AnyStepId>) => {
            if (!state.isActive) return;
            state.activeStepId = payload;
        },
        addOnboardingPath: (state, { payload }: PayloadAction<AnyPath>) => {
            if (!state.isActive) return;
            if (!state.path.includes(payload)) {
                state.path.push(payload);
            }
        },
        removeOnboardingPath: (state, { payload }: PayloadAction<AnyPath[]>) => {
            if (!state.isActive) return;
            state.path = state.path.filter(p => !payload.includes(p));
        },
        updateOnboardingAnalytics: (
            state,
            { payload }: PayloadAction<Partial<OnboardingAnalytics>>,
        ) => {
            state.onboardingAnalytics = { ...state.onboardingAnalytics, ...payload };
        },
        updateOnboardingBackupType: (state, { payload }: PayloadAction<BackupType>) => {
            if (!state.isActive) return;
            state.backupType = payload;
        },
        resetOnboarding: () => initialState,
    },
    extraReducers: builder => {
        builder.addCase(deviceDisconnected, (state, { payload }) => {
            if (!state.isActive) return;
            state.prevDeviceId = payload.id ?? null;
        });
    },
});

export const onboardingActions = onboardingSlice.actions;
export const {
    enableOnboardingReducer,
    goToOnboardingStep,
    addOnboardingPath,
    removeOnboardingPath,
    updateOnboardingAnalytics,
    updateOnboardingBackupType,
    resetOnboarding,
} = onboardingActions;
export const onboardingReducer = onboardingSlice.reducer;

type OnboardingRootState = { onboarding: OnboardingState };

export const selectIsOnboardingActive = (state: OnboardingRootState) => state.onboarding.isActive;

export const selectOnboardingAnalytics = (state: OnboardingRootState) =>
    state.onboarding.onboardingAnalytics;
