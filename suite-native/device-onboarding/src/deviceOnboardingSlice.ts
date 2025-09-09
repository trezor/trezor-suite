import { PayloadAction, createSlice } from '@reduxjs/toolkit';

type DeviceOnboardingSliceState = {
    wasDeviceOnboardingCancelled: boolean;
    isOnboardingDeviceDisconnectedAlertDisplayed: boolean;
};

export type DeviceOnboardingSliceRootState = {
    deviceOnboarding: DeviceOnboardingSliceState;
};

const deviceOnboardingSliceInitialState: DeviceOnboardingSliceState = {
    wasDeviceOnboardingCancelled: false,
    isOnboardingDeviceDisconnectedAlertDisplayed: false,
};

export const deviceOnboardingSlice = createSlice({
    name: 'deviceOnboarding',
    initialState: deviceOnboardingSliceInitialState,
    reducers: {
        setWasDeviceOnboardingCancelled: (state, { payload }: PayloadAction<boolean>) => {
            state.wasDeviceOnboardingCancelled = payload;
        },
        setIsOnboardingDeviceDisconnectedAlertDisplayed: (
            state,
            { payload }: PayloadAction<boolean>,
        ) => {
            state.isOnboardingDeviceDisconnectedAlertDisplayed = payload;
        },
    },
});

export const selectWasDeviceOnboardingCancelled = (state: DeviceOnboardingSliceRootState) =>
    state.deviceOnboarding.wasDeviceOnboardingCancelled;

export const selectIsOnboardingDeviceDisconnectedAlertDisplayed = (
    state: DeviceOnboardingSliceRootState,
) => state.deviceOnboarding.isOnboardingDeviceDisconnectedAlertDisplayed;

export const { setWasDeviceOnboardingCancelled, setIsOnboardingDeviceDisconnectedAlertDisplayed } =
    deviceOnboardingSlice.actions;

export const deviceOnboardingReducer = deviceOnboardingSlice.reducer;
