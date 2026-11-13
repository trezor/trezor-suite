import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

type DeviceOnboardingSliceState = {
    // Intentionally not persisted, and global rather than per device. Cancelling only lets the user leave the onboarding
    // (e.g. to visit settings) for the rest of the session, where they can restart it from the home screen.
    // In the next session, connecting a device that needs it (incl. its interactive device checks) starts it automatically again.
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
