import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type EarnYieldWorkerBaseUrl } from '@suite-common/earn-stablecoin-defs';
import { isDetoxTestBuild } from '@suite-native/config';
import { DEVICE } from '@trezor/connect';

export type ExperimentalFeature = 'suite-sync' | 'slip24';

export interface AppSettingsState {
    isOnboardingFinished: boolean;
    isDeviceAuthenticityCheckEnabled: boolean;
    isFirmwareRevisionCheckEnabled: boolean;
    isFirmwareHashCheckEnabled: boolean;
    areDeviceMetaChecksEnabled: boolean;
    areTestnetsEnabled: boolean;
    experimentalFeatures: ExperimentalFeature[];
    shouldShowAutoEjectAlert: boolean;
    hasAutoEjectAlertBeenDisplayed: boolean;
    earnYieldWorkerBaseUrl?: EarnYieldWorkerBaseUrl;
}

export type SettingsSliceRootState = {
    appSettings: AppSettingsState;
};

export const appSettingsInitialState: AppSettingsState = {
    isOnboardingFinished: false,
    isDeviceAuthenticityCheckEnabled:
        process.env.EXPO_PUBLIC_IS_DEVICE_AUTHENTICITY_CHECK_ENABLED !== 'false',
    isFirmwareRevisionCheckEnabled:
        process.env.EXPO_PUBLIC_IS_FIRMWARE_REVISION_CHECK_ENABLED !== 'false',
    isFirmwareHashCheckEnabled: process.env.EXPO_PUBLIC_IS_FIRMWARE_HASH_CHECK_ENABLED !== 'false',
    areDeviceMetaChecksEnabled: process.env.EXPO_PUBLIC_ARE_DEVICE_META_CHECKS_ENABLED !== 'false',
    areTestnetsEnabled: isDetoxTestBuild(),
    experimentalFeatures: [],
    shouldShowAutoEjectAlert: false,
    hasAutoEjectAlertBeenDisplayed: false,
    earnYieldWorkerBaseUrl: undefined,
};

export const appSettingsPersistWhitelist: Array<keyof AppSettingsState> = [
    'isOnboardingFinished',
    'isDeviceAuthenticityCheckEnabled',
    'isFirmwareRevisionCheckEnabled',
    'isFirmwareHashCheckEnabled',
    'areDeviceMetaChecksEnabled',
    'areTestnetsEnabled',
    'experimentalFeatures',
    'hasAutoEjectAlertBeenDisplayed',
    'earnYieldWorkerBaseUrl',
];

const appSettingsSlice = createSlice({
    name: 'appSettings',
    initialState: appSettingsInitialState,
    reducers: {
        setIsOnboardingFinished: state => {
            state.isOnboardingFinished = true;
        },
        setCheckFirmwareAuthenticityEnabled: (state, { payload }: PayloadAction<boolean>) => {
            state.isFirmwareRevisionCheckEnabled = payload;
            state.isFirmwareHashCheckEnabled = payload;
            state.areDeviceMetaChecksEnabled = payload;
        },
        setDeviceAuthenticityCheckEnabled: (state, { payload }: PayloadAction<boolean>) => {
            state.isDeviceAuthenticityCheckEnabled = payload;
        },
        toggleAreTestnetsEnabled: state => {
            state.areTestnetsEnabled = !state.areTestnetsEnabled;
        },
        toggleExperimentalFeature: (state, { payload }: PayloadAction<ExperimentalFeature>) => {
            if (state.experimentalFeatures.includes(payload)) {
                state.experimentalFeatures = state.experimentalFeatures.filter(
                    feature => feature !== payload,
                );
            } else {
                state.experimentalFeatures.push(payload);
            }
        },
        setShouldShowAutoEjectAlert: (state, { payload }: PayloadAction<boolean>) => {
            state.shouldShowAutoEjectAlert = payload;
        },
        setHasAutoEjectAlertBeenDisplayed: (state, { payload }: PayloadAction<boolean>) => {
            state.hasAutoEjectAlertBeenDisplayed = payload;
        },
        setEarnWorkerEnvironment: (state, { payload }: PayloadAction<EarnYieldWorkerBaseUrl>) => {
            state.earnYieldWorkerBaseUrl = payload;
        },
    },
    extraReducers: builder => {
        builder.addCase(DEVICE.CONNECT, state => {
            state.shouldShowAutoEjectAlert = false;
        });
    },
});

export const selectIsOnboardingFinished = (state: SettingsSliceRootState) =>
    state.appSettings.isOnboardingFinished;
export const selectIsDeviceAuthenticityCheckEnabled = (state: SettingsSliceRootState) =>
    state.appSettings.isDeviceAuthenticityCheckEnabled;

export const selectShouldShowAutoEjectAlert = (state: SettingsSliceRootState) =>
    state.appSettings.shouldShowAutoEjectAlert;

export const selectAreTestnetsEnabled = (state: SettingsSliceRootState) =>
    state.appSettings.areTestnetsEnabled;

export const selectIsExperimentalFeatureEnabled = (
    state: SettingsSliceRootState,
    feature: ExperimentalFeature,
) => state.appSettings.experimentalFeatures.includes(feature);

export const selectHasAutoEjectAlertBeenDisplayed = (state: SettingsSliceRootState) =>
    state.appSettings.hasAutoEjectAlertBeenDisplayed;

export const selectEarnYieldWorkerBaseUrl = (state: SettingsSliceRootState) =>
    state.appSettings.earnYieldWorkerBaseUrl;

export const selectIsFirmwareRevisionCheckEnabled = (state: SettingsSliceRootState) =>
    state.appSettings.isFirmwareRevisionCheckEnabled;
export const selectIsFirmwareHashCheckEnabled = (state: SettingsSliceRootState) =>
    state.appSettings.isFirmwareHashCheckEnabled;
export const selectAreDeviceMetaChecksEnabled = (state: SettingsSliceRootState) =>
    state.appSettings.areDeviceMetaChecksEnabled;

/**
 * Determine if any of FW revision, FW hash, or meta checks are disabled
 * (all are controlled by the same setting, see setCheckFirmwareAuthenticityEnabled reducer)
 */
export const selectIsFirmwareAuthenticityCheckEnabled = (state: SettingsSliceRootState) =>
    selectIsFirmwareRevisionCheckEnabled(state) &&
    selectIsFirmwareHashCheckEnabled(state) &&
    selectAreDeviceMetaChecksEnabled(state);

export const {
    setIsOnboardingFinished,
    setDeviceAuthenticityCheckEnabled,
    setCheckFirmwareAuthenticityEnabled,
    toggleAreTestnetsEnabled,
    toggleExperimentalFeature,
    setShouldShowAutoEjectAlert,
    setHasAutoEjectAlertBeenDisplayed,
    setEarnWorkerEnvironment,
} = appSettingsSlice.actions;
export const appSettingsReducer = appSettingsSlice.reducer;
