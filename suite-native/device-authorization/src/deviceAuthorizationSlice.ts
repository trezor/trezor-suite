import { createSlice, isAnyOf } from '@reduxjs/toolkit';

import { UI } from '@trezor/connect';
import { cancelPassphraseAndSelectStandardDeviceThunk } from '@suite-native/passphrase';

import { isPinButtonRequestCode } from './utils';

type DeviceAuthorizationState = {
    hasDeviceRequestedPin: boolean;
    hasDeviceRequestedPassphrase: boolean;
};

type DeviceAuthorizationRootState = {
    deviceAuthorization: DeviceAuthorizationState;
};

const deviceAuthorizationInitialState: DeviceAuthorizationState = {
    hasDeviceRequestedPin: false,
    hasDeviceRequestedPassphrase: false,
};

export const deviceAuthorizationSlice = createSlice({
    name: 'deviceAuthorization',
    initialState: deviceAuthorizationInitialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(UI.REQUEST_PIN, state => {
                state.hasDeviceRequestedPin = true;
            })
            .addCase(UI.REQUEST_PASSPHRASE, state => {
                state.hasDeviceRequestedPin = false;
                state.hasDeviceRequestedPassphrase = true;
            })
            .addCase(UI.REQUEST_BUTTON, (state, action) => {
                if (isPinButtonRequestCode(action)) {
                    state.hasDeviceRequestedPin = true;
                } else {
                    state.hasDeviceRequestedPin = false;
                }

                // @ts-expect-error Actions are not typed properly
                if (action.payload.code !== 'ButtonRequest_Other') {
                    state.hasDeviceRequestedPassphrase = false;
                }
            })
            .addCase(UI.CLOSE_UI_WINDOW, state => {
                state.hasDeviceRequestedPin = false;
                state.hasDeviceRequestedPassphrase = false;
            })
            .addMatcher(isAnyOf(cancelPassphraseAndSelectStandardDeviceThunk.pending), state => {
                state.hasDeviceRequestedPassphrase = false;
            });
    },
});

export const selectDeviceRequestedPin = (state: DeviceAuthorizationRootState) =>
    state.deviceAuthorization.hasDeviceRequestedPin;

export const selectDeviceRequestedPassphrase = (state: DeviceAuthorizationRootState) =>
    state.deviceAuthorization.hasDeviceRequestedPassphrase;

export const selectDeviceRequestedAuthorization = (state: DeviceAuthorizationRootState) =>
    selectDeviceRequestedPassphrase(state) || selectDeviceRequestedPin(state);

export const deviceAuthorizationReducer = deviceAuthorizationSlice.reducer;
