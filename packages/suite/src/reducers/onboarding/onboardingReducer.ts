import { type UnknownAction } from '@reduxjs/toolkit';
import { produce } from 'immer';

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

const addPathToState = (path: AnyPath, state: OnboardingState) => {
    if (!state.path.includes(path)) {
        return [...state.path, path];
    }

    return [...state.path];
};

const removePathsFromState = (paths: AnyPath[], state: OnboardingState) =>
    state.path.filter(p => !paths.includes(p));

const onboarding = (state: OnboardingState = initialState, action: UnknownAction) =>
    produce(state, draft => {
        if (goToStep.match(action)) {
            draft.activeStepId = action.payload;
        } else if (addPath.match(action)) {
            draft.path = addPathToState(action.payload, state);
        } else if (removePath.match(action)) {
            draft.path = removePathsFromState(action.payload, state);
        } else if (armOnboardedDeviceTracking.match(action)) {
            draft.deviceTracking = deviceTrackingReducer(state.deviceTracking, {
                type: 'arm',
                device: action.payload,
            });
        } else if (onboardedDeviceConnected.match(action)) {
            draft.deviceTracking = deviceTrackingReducer(state.deviceTracking, {
                type: 'device-connect',
                device: action.payload.device,
                isOnlyCandidate: action.payload.isOnlyCandidate,
            });
        } else if (onboardedDeviceDisconnected.match(action)) {
            draft.deviceTracking = deviceTrackingReducer(state.deviceTracking, {
                type: 'device-disconnect',
                device: action.payload,
            });
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

export default onboarding;
