import { createSlice } from '@reduxjs/toolkit';

import {
    isCloseWindowActionOrNonAuthorizationAction,
    isPassphraseAction,
    isPinAction,
} from './utils';

type DeviceAuthenticationState = {
    deviceAuthenticationState: 'pin' | 'passphrase' | null;
};

type DeviceAuthenticationRootState = {
    deviceAuthentication: DeviceAuthenticationState;
};

const deviceAuthenticationInitialState: DeviceAuthenticationState = {
    deviceAuthenticationState: null,
};

export const deviceAuthenticationSlice = createSlice({
    name: 'deviceAuthentication',
    initialState: deviceAuthenticationInitialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addMatcher(isPassphraseAction, state => {
                state.deviceAuthenticationState = 'passphrase';
            })
            .addMatcher(isPinAction, state => {
                state.deviceAuthenticationState = 'pin';
            })
            .addMatcher(isCloseWindowActionOrNonAuthorizationAction, state => {
                if (!!state.deviceAuthenticationState) {
                    state.deviceAuthenticationState = null;
                }
            });
    },
});

export const selectDeviceAuthenticationState = (state: DeviceAuthenticationRootState) =>
    state.deviceAuthentication.deviceAuthenticationState;

export const selectIsDeviceAuthenticationFlowActive = (state: DeviceAuthenticationRootState) =>
    !!selectDeviceAuthenticationState(state);

export const selectDeviceRequestedPassphrase = (state: DeviceAuthenticationRootState) =>
    selectDeviceAuthenticationState(state) === 'passphrase';

export const selectDeviceRequestedPin = (state: DeviceAuthenticationRootState) =>
    selectDeviceAuthenticationState(state) === 'pin';

export const deviceAuthenticationReducer = deviceAuthenticationSlice.reducer;
