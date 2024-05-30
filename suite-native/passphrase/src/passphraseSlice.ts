import { createSlice, isAnyOf } from '@reduxjs/toolkit';

import {
    AuthorizeDeviceError,
    CreateDeviceInstanceError,
    authorizeDeviceThunk,
    createDeviceInstanceThunk,
} from '@suite-common/wallet-core';

type PassphraseState = {
    error: AuthorizeDeviceError | CreateDeviceInstanceError | null;
};

type PassphraseRootState = {
    passphrase: PassphraseState;
};

const passphraseInitialState: PassphraseState = {
    error: null,
};

export const passphraseSlice = createSlice({
    name: 'passphrase',
    initialState: passphraseInitialState,
    reducers: {},
    extraReducers: builder => {
        builder
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

export const passphraseReducer = passphraseSlice.reducer;
