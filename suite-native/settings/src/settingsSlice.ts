import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { isDetoxTestBuild } from '@suite-native/config';
import { DEVICE } from '@trezor/connect';

export type ExperimentalFeature = 'suite-sync' | 'tron-view-only';

export interface AppSettingsState {
    isOnboardingFinished: boolean;
    isDeviceAuthenticityCheckEnabled: boolean;
    isFirmwareRevisionCheckEnabled: boolean;
    isFirmwareHashCheckEnabled: boolean;
    areTestnetsEnabled: boolean;
    shouldShowAutoEjectAlert: boolean;
    hasAutoEjectAlertBeenDisplayed: boolean;
    isTronEnabled: boolean;
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
    isTronEnabled: false,
};

export const appSettingsPersistWhitelist: Array<keyof AppSettingsState> = [
    'isOnboardingFinished',
    'isDeviceAuthenticityCheckEnabled',
    'isFirmwareRevisionCheckEnabled',
    'isFirmwareHashCheckEnabled',
    'areTestnetsEnabled',
    'hasAutoEjectAlertBeenDisplayed',
    'isTronEnabled',
];

export const appSettingsSlice = createSlice({
    name: 'appSettings',
    initialState: appSettingsInitialState,
    reducers: {
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
        toggleIsTronEnabled: state => {
            state.isTronEnabled = !state.isTronEnabled;
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

export const selectIsTronEnabled = (state: SettingsSliceRootState) =>
    state.appSettings.isTronEnabled;

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
    toggleIsTronEnabled,
} = appSettingsSlice.actions;
export const appSettingsReducer = appSettingsSlice.reducer;
