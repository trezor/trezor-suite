import { PayloadAction, createSlice, isAnyOf } from '@reduxjs/toolkit';

import { UI } from '@trezor/connect';
import {
    AuthorizeDeviceError,
    CreateDeviceInstanceError,
    authorizeDeviceThunk,
    createDeviceInstanceThunk,
} from '@suite-common/wallet-core';

import { isPinButtonRequestCode } from './utils';
import {
    cancelPassphraseAndSelectStandardDeviceThunk,
    verifyPassphraseOnEmptyWalletThunk,
} from './passphraseThunks';

type DeviceAuthorizationState = {
    hasDeviceRequestedPin: boolean;
    hasDeviceRequestedPassphrase: boolean;
    passphraseError: AuthorizeDeviceError | CreateDeviceInstanceError | null;
    isVefifyingPassphraseOnEmptyWallet: boolean;
    isCreatingNewWalletInstance: boolean;
};

type DeviceAuthorizationRootState = {
    deviceAuthorization: DeviceAuthorizationState;
};

const deviceAuthorizationInitialState: DeviceAuthorizationState = {
    hasDeviceRequestedPin: false,
    hasDeviceRequestedPassphrase: false,
    passphraseError: null,
    isVefifyingPassphraseOnEmptyWallet: false,
    isCreatingNewWalletInstance: false,
};

export const deviceAuthorizationSlice = createSlice({
    name: 'deviceAuthorization',
    initialState: deviceAuthorizationInitialState,
    reducers: {
        resetError: state => {
            state.passphraseError = null;
        },
        setIsCreatingNewWalletInstance: (state, { payload }: PayloadAction<boolean>) => {
            state.isCreatingNewWalletInstance = payload;
        },
    },
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
            .addCase(verifyPassphraseOnEmptyWalletThunk.pending.type, state => {
                state.isVefifyingPassphraseOnEmptyWallet = true;
            })
            .addCase(cancelPassphraseAndSelectStandardDeviceThunk.pending.type, state => {
                state.isCreatingNewWalletInstance = false;
                state.hasDeviceRequestedPassphrase = false;
            })
            .addMatcher(
                isAnyOf(
                    verifyPassphraseOnEmptyWalletThunk.fulfilled,
                    verifyPassphraseOnEmptyWalletThunk.rejected,
                ),
                state => {
                    state.isVefifyingPassphraseOnEmptyWallet = false;
                    state.isCreatingNewWalletInstance = false;
                },
            )
            .addMatcher(isAnyOf(createDeviceInstanceThunk.pending), state => {
                state.passphraseError = null;
                state.isCreatingNewWalletInstance = true;
            })
            .addMatcher(
                isAnyOf(authorizeDeviceThunk.rejected, createDeviceInstanceThunk.rejected),
                (state, { payload }) => {
                    if (
                        payload?.error === 'passphrase-duplicate' ||
                        payload?.error === 'passphrase-enabling-cancelled'
                    ) {
                        state.passphraseError = payload;
                        state.isCreatingNewWalletInstance = false;
                    }
                },
            );
    },
});

export const selectDeviceRequestedPin = (state: DeviceAuthorizationRootState) =>
    state.deviceAuthorization.hasDeviceRequestedPin;

export const selectDeviceRequestedPassphrase = (state: DeviceAuthorizationRootState) =>
    state.deviceAuthorization.hasDeviceRequestedPassphrase;

export const selectDeviceRequestedAuthorization = (state: DeviceAuthorizationRootState) =>
    selectDeviceRequestedPassphrase(state) || selectDeviceRequestedPin(state);

export const selectPassphraseError = (state: DeviceAuthorizationRootState) =>
    state.deviceAuthorization.passphraseError;

export const selectPassphraseDuplicateError = (state: DeviceAuthorizationRootState) => {
    return state.deviceAuthorization.passphraseError?.error === 'passphrase-duplicate'
        ? state.deviceAuthorization.passphraseError
        : null;
};

export const selectIsVerifyingPassphraseOnEmptyWallet = (state: DeviceAuthorizationRootState) =>
    state.deviceAuthorization.isVefifyingPassphraseOnEmptyWallet;

export const selectIsCreatingNewPassphraseWallet = (state: DeviceAuthorizationRootState) =>
    state.deviceAuthorization.isCreatingNewWalletInstance;

export const { setIsCreatingNewWalletInstance, resetError } = deviceAuthorizationSlice.actions;

export const deviceAuthorizationReducer = deviceAuthorizationSlice.reducer;
