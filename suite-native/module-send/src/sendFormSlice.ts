import { PayloadAction } from '@reduxjs/toolkit';

import { createSliceWithExtraDeps } from '@suite-common/redux-utils';
import {
    SendState as CommonSendState,
    prepareSendFormReducer as prepareCommonSendFormReducer,
    initialState as commonInitialState,
} from '@suite-common/wallet-core';
import { SignedTransaction } from '@trezor/connect';

import { onDeviceTransactionReviewThunk } from './sendFormThunks';

export type NativeSignedTransaction = SignedTransaction['signedTransaction'];

type NativeSendState = CommonSendState & {
    signingError?: string;
    signedTxMetadata?: NativeSignedTransaction;
};

export type NativeSendRootState = {
    wallet: {
        send: NativeSendState;
    };
};

export const initialNativeState: NativeSendState = {
    ...commonInitialState,
    signingError: undefined,
    signedTxMetadata: undefined,
};

export const sendFormSlice = createSliceWithExtraDeps({
    name: 'send',
    initialState: initialNativeState,
    reducers: {
        setX: (state, { payload }: PayloadAction<string>) => {
            state.signingError = payload;
        },
    },
    extraReducers: (builder, extra) => {
        const commonSendFormReducer = prepareCommonSendFormReducer(extra);
        builder
            .addCase(onDeviceTransactionReviewThunk.pending, state => {
                delete state.signingError;
            })
            .addCase(
                onDeviceTransactionReviewThunk.fulfilled,
                (state, { payload }: PayloadAction<NativeSignedTransaction>) => {
                    state.signedTxMetadata = payload;
                },
            )
            .addCase(onDeviceTransactionReviewThunk.rejected, (state, { payload }) => {
                state.signingError = payload as string;
            })
            // In case that this reducer does not match the action, try to handle it by suite-common sendFormReducer.
            .addDefaultCase((state, action) => {
                commonSendFormReducer(state, action);
            });
    },
});

export const selectSignedTxMetadata = (state: NativeSendRootState) =>
    state.wallet.send.signedTxMetadata;

export const selectSigningError = (state: NativeSendRootState) => state.wallet.send.signingError;
