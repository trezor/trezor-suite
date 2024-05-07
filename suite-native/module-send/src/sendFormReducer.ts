import { PayloadAction } from '@reduxjs/toolkit';

import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import {
    SendState as CommonSendState,
    prepareSendFormReducer as prepareCommonSendFormReducer,
    initialState as commonInitialState,
} from '@suite-common/wallet-core';
import { SignedTransaction } from '@trezor/connect';

import { onDeviceTransactionReviewThunk } from './sendFormThunks';

export type NativeSignedTransaction = SignedTransaction['signedTransaction'];

type NativeSendState = CommonSendState & {
    error?: string;
    nativeSignedTx: NativeSignedTransaction;
};

export type NativeSendRootState = {
    wallet: {
        send: NativeSendState;
    };
};

export const initialNativeState: NativeSendState = {
    ...commonInitialState,
    error: undefined,
    nativeSignedTx: undefined,
};

export const prepareNativeSendFormReducer = createReducerWithExtraDeps(
    initialNativeState,
    (builder, extra) => {
        const commonSendFormReducer = prepareCommonSendFormReducer(extra);

        builder
            .addCase(onDeviceTransactionReviewThunk.pending, state => {
                delete state.error;
            })
            .addCase(
                onDeviceTransactionReviewThunk.fulfilled,
                (state, { payload }: PayloadAction<NativeSignedTransaction>) => {
                    state.nativeSignedTx = payload;
                },
            )
            .addCase(onDeviceTransactionReviewThunk.rejected, (state, { payload }) => {
                state.error = payload as string;
            })
            // In case that suite-native/module-send action was not, try to handle it by suite-common sendFormReducer.
            .addDefaultCase((state, action) => {
                commonSendFormReducer(state, action);
            });
    },
);

export const selectNativeSignedTx = (state: NativeSendRootState) =>
    state.wallet.send.nativeSignedTx;
