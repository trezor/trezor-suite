import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { SignedTransaction } from '@trezor/connect';

import { onDeviceTransactionReviewThunk } from './sendFormThunks';

export type NativeSignedTransaction = SignedTransaction['signedTransaction'];

type SendModuleState = {
    error: string | null;
    nativeSignedTransaction: NativeSignedTransaction | null;
};

type SendModuleRootState = {
    sendModule: SendModuleState;
};

const sendModuleSliceInitialState: SendModuleState = {
    error: null,
    nativeSignedTransaction: null,
};

export const sendModuleSlice = createSlice({
    name: 'sendModule',
    initialState: sendModuleSliceInitialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(onDeviceTransactionReviewThunk.pending, state => {
                state.error = null;
            })
            .addCase(
                onDeviceTransactionReviewThunk.fulfilled,
                (state, { payload }: PayloadAction<NativeSignedTransaction>) => {
                    state.nativeSignedTransaction = payload;
                },
            )
            .addCase(onDeviceTransactionReviewThunk.rejected, (state, { payload }) => {
                state.error = payload as string;
            });
    },
});

export const selectSendModuleError = (state: SendModuleRootState) => state.sendModule.error;
export const selectNativeSignedTransaction = (state: SendModuleRootState) =>
    state.sendModule.nativeSignedTransaction ?? null;

export const sendModuleReducer = sendModuleSlice.reducer;
