import { createSlice, isAnyOf, isRejected } from '@reduxjs/toolkit';

import { UI } from '@trezor/connect';
import {
    AuthorizeDeviceError,
    CreateDeviceInstanceError,
    authorizeDeviceThunk,
    createDeviceInstanceThunk,
} from '@suite-common/wallet-core';

import { isPinButtonRequestCode } from './utils';
import {
    VerifyPassphraseOnEmptyWalletError,
    cancelPassphraseAndSelectStandardDeviceThunk,
    retryPassphraseAuthenticationThunk,
    verifyPassphraseOnEmptyWalletThunk,
} from './passphraseThunks';

type DeviceAuthorizationState = {
    hasDeviceRequestedPin: boolean;
    hasDeviceRequestedPassphrase: boolean;
    passphraseError:
        | AuthorizeDeviceError
        | CreateDeviceInstanceError
        | VerifyPassphraseOnEmptyWalletError
        | null;
    isVerifyingPassphraseOnEmptyWallet: boolean;
    isCreatingNewWalletInstance: boolean;
};

type DeviceAuthorizationRootState = {
    deviceAuthorization: DeviceAuthorizationState;
};

const deviceAuthorizationInitialState: DeviceAuthorizationState = {
    hasDeviceRequestedPin: false,
    hasDeviceRequestedPassphrase: false,
    passphraseError: null,
    isVerifyingPassphraseOnEmptyWallet: false,
    isCreatingNewWalletInstance: false,
};

export const deviceAuthorizationSlice = createSlice({
    name: 'deviceAuthorization',
    initialState: deviceAuthorizationInitialState,
    reducers: {
        resetError: state => {
            state.passphraseError = null;
        },
        finishPassphraseFlow: state => {
            state.hasDeviceRequestedPassphrase = false;
            state.passphraseError = null;
            state.isCreatingNewWalletInstance = false;
            state.isVerifyingPassphraseOnEmptyWallet = false;
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
                if (!state.isCreatingNewWalletInstance) {
                    state.hasDeviceRequestedPassphrase = false;
                }
            })
            .addCase(verifyPassphraseOnEmptyWalletThunk.pending.type, state => {
                state.isVerifyingPassphraseOnEmptyWallet = true;
            })
            .addCase(cancelPassphraseAndSelectStandardDeviceThunk.pending.type, state => {
                state.isCreatingNewWalletInstance = false;
                state.hasDeviceRequestedPassphrase = false;
                state.passphraseError = null;
            })
            .addCase(retryPassphraseAuthenticationThunk.pending, state => {
                state.passphraseError = null;
            })
            .addCase(createDeviceInstanceThunk.pending, state => {
                state.isCreatingNewWalletInstance = true;
                state.passphraseError = null;
            })
            .addMatcher(
                isAnyOf(
                    verifyPassphraseOnEmptyWalletThunk.fulfilled,
                    verifyPassphraseOnEmptyWalletThunk.rejected,
                ),
                (state, action) => {
                    if (isRejected(action) && action.payload) {
                        state.passphraseError = action.payload;
                    } else {
                        state.isVerifyingPassphraseOnEmptyWallet = false;
                        state.isCreatingNewWalletInstance = false;
                    }
                },
            )
            .addMatcher(
                isAnyOf(authorizeDeviceThunk.rejected, createDeviceInstanceThunk.rejected),
                (state, { payload }) => {
                    if (
                        payload?.error === 'passphrase-duplicate' ||
                        payload?.error === 'passphrase-enabling-cancelled' ||
                        payload?.error === 'auth-failed'
                    ) {
                        state.passphraseError = payload;
                        state.isCreatingNewWalletInstance = false;
                        state.hasDeviceRequestedPassphrase = false;
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

export const selectHasAuthFailed = (state: DeviceAuthorizationRootState) =>
    selectPassphraseError(state)?.error === 'auth-failed';

export const selectPassphraseDuplicateError = (state: DeviceAuthorizationRootState) => {
    return selectPassphraseError(state)?.error === 'passphrase-duplicate'
        ? (state.deviceAuthorization.passphraseError as AuthorizeDeviceError)
        : null;
};

export const selectHasVerificationCancelledError = (state: DeviceAuthorizationRootState) =>
    selectPassphraseError(state)?.error === 'action-cancelled';

export const selectHasPassphraseMismatchError = (state: DeviceAuthorizationRootState) =>
    selectPassphraseError(state)?.error === 'passphrase-mismatch';

export const selectIsVerifyingPassphraseOnEmptyWallet = (state: DeviceAuthorizationRootState) =>
    state.deviceAuthorization.isVerifyingPassphraseOnEmptyWallet;

export const selectIsCreatingNewPassphraseWallet = (state: DeviceAuthorizationRootState) =>
    state.deviceAuthorization.isCreatingNewWalletInstance;

export const { resetError, finishPassphraseFlow } = deviceAuthorizationSlice.actions;

export const deviceAuthorizationReducer = deviceAuthorizationSlice.reducer;
