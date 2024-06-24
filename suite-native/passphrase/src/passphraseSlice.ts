import { createSlice, isAnyOf } from '@reduxjs/toolkit';

import {
    AuthorizeDeviceError,
    CreateDeviceInstanceError,
    authorizeDeviceThunk,
    createDeviceInstanceThunk,
} from '@suite-common/wallet-core';

import { verifyPassphraseOnEmptyWalletThunk } from './passphraseThunks';

type PassphraseState = {
    error: AuthorizeDeviceError | CreateDeviceInstanceError | null;
    isVefifyingPassphraseOnEmptyWallet: boolean;
};

type PassphraseRootState = {
    passphrase: PassphraseState;
};

const passphraseInitialState: PassphraseState = {
    error: null,
    isVefifyingPassphraseOnEmptyWallet: false,
};

export const passphraseSlice = createSlice({
    name: 'passphrase',
    initialState: passphraseInitialState,
    reducers: {},
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
                },
            )
            .addMatcher(
                isAnyOf(authorizeDeviceThunk.pending, createDeviceInstanceThunk.pending),
                state => {
                    state.error = null;
                },
            )
            .addMatcher(
                isAnyOf(authorizeDeviceThunk.rejected, createDeviceInstanceThunk.rejected),
                (state, { payload }) => {
                    if (
                        payload?.error === 'passphrase-duplicate' ||
                        payload?.error === 'passphrase-enabling-cancelled'
                    ) {
                        state.error = payload;
                    }
                },
            );
    },
});

export const selectPassphraseError = (state: PassphraseRootState) => state.passphrase.error;

export const selectPassphraseDuplicateError = (state: PassphraseRootState) => {
    return state.passphrase.error?.error === 'passphrase-duplicate' ? state.passphrase.error : null;
};

export const selectIsVerifyingPassphraseOnEmptyWallet = (state: PassphraseRootState) =>
    state.passphrase.isVefifyingPassphraseOnEmptyWallet;

export const passphraseReducer = passphraseSlice.reducer;
