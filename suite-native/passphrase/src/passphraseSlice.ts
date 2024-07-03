import { PayloadAction, createSlice, isAnyOf } from '@reduxjs/toolkit';

import {
    AuthorizeDeviceError,
    CreateDeviceInstanceError,
    authorizeDeviceThunk,
    createDeviceInstanceThunk,
} from '@suite-common/wallet-core';

import {
    cancelPassphraseAndSelectStandardDeviceThunk,
    verifyPassphraseOnEmptyWalletThunk,
} from './passphraseThunks';

type PassphraseState = {
    error: AuthorizeDeviceError | CreateDeviceInstanceError | null;
    isVefifyingPassphraseOnEmptyWallet: boolean;
    isCreatingNewWalletInstance: boolean;
};

type PassphraseRootState = {
    passphrase: PassphraseState;
};

const passphraseInitialState: PassphraseState = {
    error: null,
    isVefifyingPassphraseOnEmptyWallet: false,
    isCreatingNewWalletInstance: false,
};

export const passphraseSlice = createSlice({
    name: 'passphrase',
    initialState: passphraseInitialState,
    reducers: {
        resetError: state => {
            state.error = null;
        },
        setIsCreatingNewWalletInstance: (state, { payload }: PayloadAction<boolean>) => {
            state.isCreatingNewWalletInstance = payload;
        },
    },
    extraReducers: builder => {
        builder
            .addCase(verifyPassphraseOnEmptyWalletThunk.pending.type, state => {
                state.isVefifyingPassphraseOnEmptyWallet = true;
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
                state.error = null;
                state.isCreatingNewWalletInstance = true;
            })
            .addMatcher(
                isAnyOf(authorizeDeviceThunk.rejected, createDeviceInstanceThunk.rejected),
                (state, { payload }) => {
                    if (
                        payload?.error === 'passphrase-duplicate' ||
                        payload?.error === 'passphrase-enabling-cancelled'
                    ) {
                        state.error = payload;
                        state.isCreatingNewWalletInstance = false;
                    }
                },
            )
            .addMatcher(isAnyOf(cancelPassphraseAndSelectStandardDeviceThunk.pending), state => {
                state.isCreatingNewWalletInstance = false;
            });
    },
});

export const selectPassphraseError = (state: PassphraseRootState) => state.passphrase.error;

export const selectPassphraseDuplicateError = (state: PassphraseRootState) => {
    return state.passphrase.error?.error === 'passphrase-duplicate' ? state.passphrase.error : null;
};

export const selectIsVerifyingPassphraseOnEmptyWallet = (state: PassphraseRootState) =>
    state.passphrase.isVefifyingPassphraseOnEmptyWallet;

export const selectIsCreatingNewPassphraseWallet = (state: PassphraseRootState) =>
    state.passphrase.isCreatingNewWalletInstance;

export const { setIsCreatingNewWalletInstance, resetError } = passphraseSlice.actions;

export const passphraseReducer = passphraseSlice.reducer;
