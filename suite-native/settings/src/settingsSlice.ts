import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { isDetoxTestBuild } from '@suite-native/config';
import { DEVICE } from '@trezor/connect';

export type ExperimentalFeature = 'suite-sync';

export interface AppSettingsState {
    isOnboardingFinished: boolean;
    isDeviceAuthenticityCheckEnabled: boolean;
    isFirmwareRevisionCheckEnabled: boolean;
    isFirmwareHashCheckEnabled: boolean;
    areTestnetsEnabled: boolean;
    shouldShowAutoEjectAlert: boolean;
    hasAutoEjectAlertBeenDisplayed: boolean;
    experimentalFeatures?: ExperimentalFeature[]; // undefined = disabled, empty array = enabled
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
    areTestnetsEnabled: isDetoxTestBuild(),
    shouldShowAutoEjectAlert: false,
    hasAutoEjectAlertBeenDisplayed: false,
};

export const appSettingsPersistWhitelist: Array<keyof AppSettingsState> = [
    'isOnboardingFinished',
    'isDeviceAuthenticityCheckEnabled',
    'isFirmwareRevisionCheckEnabled',
    'isFirmwareHashCheckEnabled',
    'areTestnetsEnabled',
    'hasAutoEjectAlertBeenDisplayed',
    'experimentalFeatures',
];

export const appSettingsSlice = createSlice({
    name: 'appSettings',
    initialState: appSettingsInitialState,
    reducers: {
        allowExperimentalFeatures: state => {
            state.experimentalFeatures = [];
        },
        disallowExperimentalFeatures: state => {
            state.experimentalFeatures = undefined;
        },
        enableExperimentalFeature: (state, { payload }: PayloadAction<ExperimentalFeature>) => {
            if (!state.experimentalFeatures) {
                state.experimentalFeatures = [payload];
            } else if (!state.experimentalFeatures.includes(payload)) {
                state.experimentalFeatures.push(payload);
            }
        },
        disableExperimentalFeature: (state, { payload }: PayloadAction<ExperimentalFeature>) => {
            state.experimentalFeatures = state.experimentalFeatures
                ? state.experimentalFeatures.filter(feature => feature !== payload)
                : state.experimentalFeatures;
        },
        setIsOnboardingFinished: state => {
            state.isOnboardingFinished = true;
        },
        setCheckFirmwareAuthenticityEnabled: (state, { payload }: PayloadAction<boolean>) => {
            state.isFirmwareRevisionCheckEnabled = payload;
            state.isFirmwareHashCheckEnabled = payload;
        },
        setDeviceAuthenticityCheckEnabled: (state, { payload }: PayloadAction<boolean>) => {
            state.isDeviceAuthenticityCheckEnabled = payload;
        },
        toggleAreTestnetsEnabled: state => {
            state.areTestnetsEnabled = !state.areTestnetsEnabled;
        },
        setShouldShowAutoEjectAlert: (state, { payload }: PayloadAction<boolean>) => {
            state.shouldShowAutoEjectAlert = payload;
        },
        setHasAutoEjectAlertBeenDisplayed: (state, { payload }: PayloadAction<boolean>) => {
            state.hasAutoEjectAlertBeenDisplayed = payload;
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

export const selectHasAutoEjectAlertBeenDisplayed = (state: SettingsSliceRootState) =>
    state.appSettings.hasAutoEjectAlertBeenDisplayed;

/**
 * Determine if either FW revision or FW hash check is disabled
 * (both are controlled by the same setting, see setCheckFirmwareAuthenticityEnabled reducer)
 */
export const selectIsFirmwareAuthenticityCheckEnabled = (state: SettingsSliceRootState) =>
    state.appSettings.isFirmwareRevisionCheckEnabled &&
    state.appSettings.isFirmwareHashCheckEnabled;

export const {
    setIsOnboardingFinished,
    setDeviceAuthenticityCheckEnabled,
    setCheckFirmwareAuthenticityEnabled,
    toggleAreTestnetsEnabled,
    setShouldShowAutoEjectAlert,
    setHasAutoEjectAlertBeenDisplayed,
    allowExperimentalFeatures,
    disallowExperimentalFeatures,
    enableExperimentalFeature,
    disableExperimentalFeature,
} = appSettingsSlice.actions;
export const appSettingsReducer = appSettingsSlice.reducer;

export const selectAreExperimentalFeaturesAllowed = (state: SettingsSliceRootState) =>
    state.appSettings.experimentalFeatures !== undefined;

export const selectEnabledExperimentalFeatures = (state: SettingsSliceRootState) =>
    returnStableArrayIfEmpty(state.appSettings.experimentalFeatures);

export const selectIsExperimentalFeatureEnabled = (
    state: SettingsSliceRootState,
    featureKey: ExperimentalFeature,
) => state.appSettings.experimentalFeatures?.includes(featureKey) ?? false;
