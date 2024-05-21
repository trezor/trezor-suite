import { createSlice } from '@reduxjs/toolkit';

import { AuthorizeDeviceError, authorizeDevice } from '@suite-common/wallet-core';

type PassphraseState = {
    error: AuthorizeDeviceError | null;
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
            .addCase(authorizeDevice.pending, state => {
                state.error = null;
            })
            .addCase(authorizeDevice.rejected, (state, { payload }) => {
                if (payload?.error === 'passphrase-duplicate') {
                    state.error = payload;
                }
            });
    },
});

export const selectPassphraseError = (state: PassphraseRootState) => state.passphrase.error;

export const passphraseReducer = passphraseSlice.reducer;
