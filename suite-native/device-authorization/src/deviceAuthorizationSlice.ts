import { createSlice } from '@reduxjs/toolkit';

import { UI } from '@trezor/connect';

import {
    isFlowEndingButtonRequest,
    isPinButtonRequestCode,
    isSuiteSyncButtonRequest,
} from './utils';

export enum DeviceAuthorizationStep {
    Idle = 'Idle', // Default state, AuthorizeDeviceStack should not be focused.

    // Custom continue on your trezor
    PinRequested = 'PinRequested',
    AddPassphraseWallet = 'AddPassphraseWallet', // When adding a new passphrase wallet
    PassphraseRequested = 'PassphraseRequested',
    InputPassphraseOnDevice = 'InputPassphraseOnDevice',

    // Default continue on your trezor
    ContinueOnTrezorRequested = 'ContinueOnTrezorRequested',
}

export type DeviceAuthorizationState = {
    deviceAuthorizationStep: DeviceAuthorizationStep;
};

export type DeviceAuthorizationRootState = {
    deviceAuthorization: DeviceAuthorizationState;
};

export const deviceAuthorizationInitialState: DeviceAuthorizationState = {
    deviceAuthorizationStep: DeviceAuthorizationStep.Idle,
};

export const deviceAuthorizationSlice = createSlice({
    name: 'deviceAuthorization',
    initialState: deviceAuthorizationInitialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(UI.REQUEST_PIN, state => {
                state.deviceAuthorizationStep = DeviceAuthorizationStep.PinRequested;
            })
            .addCase(UI.REQUEST_PASSPHRASE, (state, action) => {
                // @ts-expect-error payload not typed
                if (action.payload?.device?._state?.staticSessionId) {
                    state.deviceAuthorizationStep = DeviceAuthorizationStep.PassphraseRequested;
                } else if (state.deviceAuthorizationStep === DeviceAuthorizationStep.PinRequested) {
                    // If pin was requested for new passphrase wallet, we can't wait for close window to reset the state
                    // and need to do it here so we go from device authorization to passphrase flow (for wallet creation).
                    state.deviceAuthorizationStep = DeviceAuthorizationStep.Idle;
                }
            })
            .addCase(UI.CLOSE_UI_WINDOW, state => {
                state.deviceAuthorizationStep = DeviceAuthorizationStep.Idle;
            })
            .addMatcher(isFlowEndingButtonRequest, state => {
                state.deviceAuthorizationStep = DeviceAuthorizationStep.Idle;
            })
            .addMatcher(isSuiteSyncButtonRequest, state => {
                state.deviceAuthorizationStep = DeviceAuthorizationStep.ContinueOnTrezorRequested;
            })
            .addMatcher(isPinButtonRequestCode, state => {
                state.deviceAuthorizationStep = DeviceAuthorizationStep.PinRequested;
            });
    },
});

export const selectDeviceAuthorizationStep = (state: DeviceAuthorizationRootState) =>
    state.deviceAuthorization.deviceAuthorizationStep;

export const selectDeviceRequestedPin = (state: DeviceAuthorizationRootState) =>
    state.deviceAuthorization.deviceAuthorizationStep === DeviceAuthorizationStep.PinRequested;

export const selectDeviceRequestedPassphrase = (state: DeviceAuthorizationRootState) =>
    state.deviceAuthorization.deviceAuthorizationStep ===
    DeviceAuthorizationStep.PassphraseRequested;

export const selectInputPassphraseOnDevice = (state: DeviceAuthorizationRootState) =>
    state.deviceAuthorization.deviceAuthorizationStep ===
    DeviceAuthorizationStep.InputPassphraseOnDevice;

export const deviceAuthorizationReducer = deviceAuthorizationSlice.reducer;
