import { createSlice } from '@reduxjs/toolkit';

import { isCloseWindowActionOrNonPinAction, isPinAction } from './utils';

type DeviceAuthenticationState = {
    hasDeviceRequestedPin: boolean;
};

type DeviceAuthenticationRootState = {
    deviceAuthentication: DeviceAuthenticationState;
};

const deviceAuthenticationInitialState: DeviceAuthenticationState = {
    hasDeviceRequestedPin: false,
};

export const deviceAuthenticationSlice = createSlice({
    name: 'deviceAuthentication',
    initialState: deviceAuthenticationInitialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addMatcher(isPinAction, state => {
                state.hasDeviceRequestedPin = true;
            })
            .addMatcher(isCloseWindowActionOrNonPinAction, state => {
                state.hasDeviceRequestedPin = false;
            });
    },
});

export const selectDeviceRequestedPin = (state: DeviceAuthenticationRootState) =>
    state.deviceAuthentication.hasDeviceRequestedPin;

export const deviceAuthenticationReducer = deviceAuthenticationSlice.reducer;
