import { type PayloadAction, createAction, createSlice } from '@reduxjs/toolkit';

import { type OnboardingAnalytics } from '@suite/analytics';
import { type RouterRootState } from '@suite/router';
import {
    type SuiteSettingsRootState,
    selectIsDeviceAuthenticityCheckEnabled,
    selectIsUnlockedBootloaderAllowed,
} from '@suite/settings';
import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { type BackupType } from '@suite-common/suite-types';
import { DEVICE } from '@trezor/connect';

import { stepCategories } from './onboardingStepCategories';
import { isStepUsed, parseStepId, resolveNextAvailableStep } from './onboardingStepUtils';
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

export type OnboardingRootState = { onboarding: OnboardingState };

export type OnboardingFlowRootState = DeviceRootState &
    OnboardingRootState &
    RouterRootState &
    SuiteSettingsRootState;

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
            state.activeStepId = payload;
        },
        addOnboardingPath: (state, { payload }: PayloadAction<AnyPath>) => {
            if (!state.path.includes(payload)) {
                state.path.push(payload);
            }
        },
        removeOnboardingPath: (state, { payload }: PayloadAction<AnyPath[]>) => {
            state.path = state.path.filter(p => !payload.includes(p));
        },
        updateOnboardingAnalytics: (
            state,
            { payload }: PayloadAction<Partial<OnboardingAnalytics>>,
        ) => {
            state.onboardingAnalytics = { ...state.onboardingAnalytics, ...payload };
        },
        updateOnboardingBackupType: (state, { payload }: PayloadAction<BackupType>) => {
            state.backupType = payload;
        },
        resetOnboarding: () => initialState,
    },
    extraReducers: builder => {
        builder.addCase(deviceDisconnected, (state, { payload }) => {
            // Note: This is to prevent a bug when disconnect device in onboarding and connect different one.
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

export const selectIsOnboardingActive = (state: OnboardingRootState) => state.onboarding.isActive;
export const selectOnboardingAnalytics = (state: OnboardingRootState) =>
    state.onboarding.onboardingAnalytics;
export const selectActiveStepId = (state: OnboardingRootState) => state.onboarding.activeStepId;

export const selectOnboardingActiveStep = (state: OnboardingRootState) => {
    const { activeStep } = parseStepId(state.onboarding.activeStepId);

    return activeStep;
};

export const selectOnboardingPath = (state: OnboardingRootState) => state.onboarding.path;
export const selectOnboardingPrevDeviceId = (state: OnboardingRootState) =>
    state.onboarding.prevDeviceId;

export const selectOnboardingActiveStepCategory = (state: OnboardingRootState) => {
    const { activeStepCategory } = parseStepId(state.onboarding.activeStepId);

    return activeStepCategory;
};

export const selectFilteredOnboardingSteps = (state: OnboardingFlowRootState) => {
    const allSteps = stepCategories.flatMap(({ steps }) => steps);
    const isStepUsedProps = {
        device: selectSelectedDevice(state),
        onboardingPath: selectOnboardingPath(state),
        isDeviceAuthenticityCheckEnabled: selectIsDeviceAuthenticityCheckEnabled(state),
        isUnlockedBootloaderAllowed: selectIsUnlockedBootloaderAllowed(state),
    };

    return allSteps.filter(step => isStepUsed(step, isStepUsedProps));
};

export const selectResolvedNextStepAfterSkipped = (
    state: OnboardingFlowRootState,
    skippedToStepId: AnyStepId,
): AnyStepId | undefined => {
    const device = selectSelectedDevice(state);
    const stepsInPath = selectFilteredOnboardingSteps(state);

    return resolveNextAvailableStep(skippedToStepId, stepsInPath, device ?? null)?.id;
};
