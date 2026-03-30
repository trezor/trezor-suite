import { createSlice } from '@reduxjs/toolkit';

import { UI_REQUEST } from '@trezor/connect/src/exports';

import {
    isFlowEndingButtonRequest,
    isPassphraseButtonRequestCode,
    isPassphraseRequest,
    isPinButtonRequestCode,
    isSuiteSyncButtonRequest,
} from './utils';

export enum DeviceAuthorizationStep {
    Idle = 'Idle', // Default state, AuthorizeDeviceStack should not be focused.

    // Custom continue on your trezor
    PinRequested = 'PinRequested',
    PassphraseRequested = 'PassphraseRequested',

    // Default continue on your trezor
    ContinueOnTrezorRequested = 'ContinueOnTrezorRequested',
}

export type DeviceAuthorizationState = {
    deviceAuthorizationStep: DeviceAuthorizationStep;
    passphraseRequestId?: string;
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
            .addCase(UI_REQUEST.REQUEST_PIN, state => {
                state.deviceAuthorizationStep = DeviceAuthorizationStep.PinRequested;
            })
            .addCase(UI_REQUEST.REQUEST_PASSPHRASE, (state, action) => {
                state.passphraseRequestId = (
                    action as typeof action & { requestId?: string }
                ).requestId;
                if (isPassphraseRequest(action) && action.payload?.device?.state?.staticSessionId) {
                    state.deviceAuthorizationStep = DeviceAuthorizationStep.PassphraseRequested;
                } else if (state.deviceAuthorizationStep === DeviceAuthorizationStep.PinRequested) {
                    // If pin was requested for new passphrase wallet, we can't wait for close window to reset the state
                    // and need to do it here so we go from device authorization to passphrase flow (for wallet creation).
                    state.deviceAuthorizationStep = DeviceAuthorizationStep.Idle;
                }
            })
            .addCase(UI_REQUEST.CLOSE_UI_WINDOW, state => {
                state.deviceAuthorizationStep = DeviceAuthorizationStep.Idle;
                state.passphraseRequestId = undefined;
            })
            .addCase(UI_REQUEST.REQUEST_BUTTON, (state, action) => {
                if (isPinButtonRequestCode(action)) {
                    state.deviceAuthorizationStep = DeviceAuthorizationStep.PinRequested;
                } else if (isSuiteSyncButtonRequest(action)) {
                    state.deviceAuthorizationStep =
                        DeviceAuthorizationStep.ContinueOnTrezorRequested;
                } else if (isFlowEndingButtonRequest(action)) {
                    state.deviceAuthorizationStep = DeviceAuthorizationStep.Idle;
                }
            })
            // This matcher is specific for THP flow when:
            // 1. You have pin locked TS7 and try to open passphrase
            // 2. You enter passphrase but PIN pops up
            // 3. After pin is succesfully entered, we receive next step passphrase button request so we reset to Idle so passphrase module gets focused.
            .addMatcher(isPassphraseButtonRequestCode, (state, action) => {
                if (
                    !action.payload.device.state &&
                    state.deviceAuthorizationStep === DeviceAuthorizationStep.PinRequested
                ) {
                    state.deviceAuthorizationStep = DeviceAuthorizationStep.Idle;
                }
            });
    },
});

export const selectDeviceAuthorizationStep = (state: DeviceAuthorizationRootState) =>
    state.deviceAuthorization.deviceAuthorizationStep;

export const selectDeviceRequestedPin = (state: DeviceAuthorizationRootState) =>
    state.deviceAuthorization.deviceAuthorizationStep === DeviceAuthorizationStep.PinRequested;

export const selectPassphraseRequestId = (state: DeviceAuthorizationRootState) =>
    state.deviceAuthorization.passphraseRequestId;

export const deviceAuthorizationReducer = deviceAuthorizationSlice.reducer;
