import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { isDetoxTestBuild } from '@suite-native/config';

export interface AppSettingsState {
    isOnboardingFinished: boolean;
    isCoinEnablingInitFinished: boolean;
    viewOnlyCancelationTimestamp?: number;
    isDeviceAuthenticityCheckEnabled: boolean;
    isFirmwareRevisionCheckEnabled: boolean;
    isFirmwareHashCheckEnabled: boolean;
    areTestnetsEnabled: boolean;
}

export type SettingsSliceRootState = {
    appSettings: AppSettingsState;
};

export const appSettingsInitialState: AppSettingsState = {
    isOnboardingFinished: false,
    isCoinEnablingInitFinished: false,
    viewOnlyCancelationTimestamp: undefined,
    isDeviceAuthenticityCheckEnabled: true,
    isFirmwareRevisionCheckEnabled: true,
    isFirmwareHashCheckEnabled: true,
    areTestnetsEnabled: isDetoxTestBuild(),
};

export const appSettingsPersistWhitelist: Array<keyof AppSettingsState> = [
    'isOnboardingFinished',
    'isCoinEnablingInitFinished',
    'viewOnlyCancelationTimestamp',
    'isDeviceAuthenticityCheckEnabled',
    'isFirmwareRevisionCheckEnabled',
    'isFirmwareHashCheckEnabled',
    'areTestnetsEnabled',
];

export const appSettingsSlice = createSlice({
    name: 'appSettings',
    initialState: appSettingsInitialState,
    reducers: {
        setIsOnboardingFinished: state => {
            state.isOnboardingFinished = true;
        },
        setViewOnlyCancelationTimestamp: (state, { payload }: PayloadAction<number>) => {
            state.viewOnlyCancelationTimestamp = payload;
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
        setIsCoinEnablingInitFinished: (state, { payload }: PayloadAction<boolean>) => {
            state.isCoinEnablingInitFinished = payload;
        },
    },
});

export const selectIsOnboardingFinished = (state: SettingsSliceRootState) =>
    state.appSettings.isOnboardingFinished;
export const selectViewOnlyCancelationTimestamp = (state: SettingsSliceRootState) =>
    state.appSettings.viewOnlyCancelationTimestamp;
export const selectIsDeviceAuthenticityCheckEnabled = (state: SettingsSliceRootState) =>
    state.appSettings.isDeviceAuthenticityCheckEnabled;

export const selectAreTestnetsEnabled = (state: SettingsSliceRootState) =>
    state.appSettings.areTestnetsEnabled;

export const selectIsCoinEnablingInitFinished = (state: SettingsSliceRootState) =>
    state.appSettings.isCoinEnablingInitFinished;

/**
 * Determine if either FW revision or FW hash check is disabled
 * (both are controlled by the same setting, see setCheckFirmwareAuthenticityEnabled reducer)
 */
export const selectIsFirmwareAuthenticityCheckEnabled = (state: SettingsSliceRootState) =>
    state.appSettings.isFirmwareRevisionCheckEnabled &&
    state.appSettings.isFirmwareHashCheckEnabled;

export const {
    setIsOnboardingFinished,
    setViewOnlyCancelationTimestamp,
    setDeviceAuthenticityCheckEnabled,
    setCheckFirmwareAuthenticityEnabled,
    toggleAreTestnetsEnabled,
    setIsCoinEnablingInitFinished,
} = appSettingsSlice.actions;
export const appSettingsReducer = appSettingsSlice.reducer;
