import { createReducer } from '@reduxjs/toolkit';

import { type OnboardingAnalytics } from '@suite/analytics';
import {
    type DeviceTrackingState,
    deviceTrackingInitialState,
    deviceTrackingReducer,
} from '@suite-common/device';
import { type BackupType } from '@suite-common/suite-types';

import {
    addPath,
    armOnboardedDeviceTracking,
    goToStep,
    onboardedDeviceConnected,
    onboardedDeviceDisconnected,
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
    activeStepId: AnyStepId;
    path: AnyPath[];
    onboardingAnalytics: Partial<OnboardingAnalytics>;
    /**
     * Which physical device is being onboarded. Onboarding wipes and initialises the device, so
     * its identity changes underneath us; the ref follows it across those reconnects the same way
     * the firmware update does. See `@suite-common/device` `deviceTracking`.
     */
    deviceTracking: DeviceTrackingState;
}

const initialState: OnboardingState = {
    activeStepId: STEP.ID_FIRMWARE_STEP,
    path: [],
    onboardingAnalytics: {},
    deviceTracking: deviceTrackingInitialState,
    backupType: 'shamir-single',
    backupMedium: null,
};

const onboardingReducer = createReducer(initialState, builder =>
    builder
        .addCase(goToStep, (state: OnboardingState, { payload }) => {
            state.activeStepId = payload;
        })
        .addCase(addPath, (state: OnboardingState, { payload }) => {
            if (!state.path.includes(payload)) {
                state.path.push(payload);
            }
        })
        .addCase(removePath, (state: OnboardingState, { payload }) => {
            state.path = state.path.filter(path => !payload.includes(path));
        })
        .addCase(armOnboardedDeviceTracking, (state: OnboardingState, { payload }) => {
            state.deviceTracking = deviceTrackingReducer(state.deviceTracking, {
                type: 'arm',
                device: payload,
            });
        })
        .addCase(onboardedDeviceConnected, (state: OnboardingState, { payload }) => {
            state.deviceTracking = deviceTrackingReducer(state.deviceTracking, {
                type: 'device-connect',
                device: payload.device,
                isOnlyCandidate: payload.isOnlyCandidate,
            });
        })
        .addCase(onboardedDeviceDisconnected, (state: OnboardingState, { payload }) => {
            state.deviceTracking = deviceTrackingReducer(state.deviceTracking, {
                type: 'device-disconnect',
                device: payload,
            });
        })
        .addCase(updateAnalytics, (state: OnboardingState, { payload }) => {
            state.onboardingAnalytics = { ...state.onboardingAnalytics, ...payload };
        })
        .addCase(updateBackupType, (state: OnboardingState, { payload }) => {
            state.backupType = payload;
        })
        .addCase(updateBackupMedium, (state: OnboardingState, { payload }) => {
            state.backupMedium = payload;
        })
        .addCase(resetOnboarding, () => initialState),
);

export default onboardingReducer;
