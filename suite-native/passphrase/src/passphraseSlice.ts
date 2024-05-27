import { createSlice } from '@reduxjs/toolkit';

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
            .addCase(authorizeDeviceThunk.pending, state => {
                state.error = null;
            })
            .addCase(authorizeDeviceThunk.rejected, (state, { payload }) => {
                if (payload?.error === 'passphrase-duplicate') {
                    state.error = payload;
                }
            });
        builder
            .addCase(createDeviceInstanceThunk.pending, state => {
                state.error = null;
            })
            .addCase(createDeviceInstanceThunk.rejected, (state, { payload }) => {
                if (payload?.error === 'passphrase-enabling-cancelled') {
                    state.error = payload;
                }
            });
    },
});

export const selectPassphraseError = (state: PassphraseRootState) => state.passphrase.error;

export const passphraseReducer = passphraseSlice.reducer;
