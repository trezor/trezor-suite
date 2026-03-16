import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

type DeviceOnboardingSliceState = {
    wasDeviceOnboardingCancelled: boolean;
};

export type DeviceOnboardingSliceRootState = {
    deviceOnboarding: DeviceOnboardingSliceState;
};

export const deviceOnboardingSliceInitialState: DeviceOnboardingSliceState = {
    wasDeviceOnboardingCancelled: false,
};

export const deviceOnboardingSlice = createSlice({
    name: 'deviceOnboarding',
    initialState: deviceOnboardingSliceInitialState,
    reducers: {
        setWasDeviceOnboardingCancelled: (state, { payload }: PayloadAction<boolean>) => {
            state.wasDeviceOnboardingCancelled = payload;
        },
    },
});

export const selectWasDeviceOnboardingCancelled = (state: DeviceOnboardingSliceRootState) =>
    state.deviceOnboarding.wasDeviceOnboardingCancelled;

export const { setWasDeviceOnboardingCancelled } = deviceOnboardingSlice.actions;

export const deviceOnboardingReducer = deviceOnboardingSlice.reducer;
