import { isAnyOf, PayloadAction } from '@reduxjs/toolkit';

import { createSliceWithExtraDeps, createWeakMapSelector } from '@suite-common/redux-utils';
import {
    SendState as CommonSendState,
    prepareSendFormReducer as prepareCommonSendFormReducer,
    initialState as commonInitialState,
    composeSendFormTransactionFeeLevelsThunk,
    signTransactionThunk,
    pushSendFormTransactionThunk,
    SendFormError,
} from '@suite-common/wallet-core';
import {
    GeneralPrecomposedLevels,
    GeneralPrecomposedTransaction,
} from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

import { NativeSupportedFeeLevel } from './types';

type NativeSendState = CommonSendState & {
    error: null | SendFormError;
    feeLevels: GeneralPrecomposedLevels;
};

export type NativeSendRootState = {
    wallet: {
        send: NativeSendState;
    };
};

export const initialNativeState: NativeSendState = {
    ...commonInitialState,
    error: null,
    feeLevels: {},
};

export const sendFormSlice = createSliceWithExtraDeps({
    name: 'send',
    initialState: initialNativeState,
    reducers: {
        storeFeeLevels: (
            state,
            { payload }: PayloadAction<{ feeLevels: GeneralPrecomposedLevels }>,
        ) => {
            state.feeLevels = payload.feeLevels;
        },
    },
    extraReducers: (builder, extra) => {
        const commonSendFormReducer = prepareCommonSendFormReducer(extra);
        builder
            .addMatcher(
                isAnyOf(
                    composeSendFormTransactionFeeLevelsThunk.pending,
                    signTransactionThunk.pending,
                    pushSendFormTransactionThunk.pending,
                ),
                state => {
                    state.error = null;
                },
            )
            .addMatcher(
                isAnyOf(
                    composeSendFormTransactionFeeLevelsThunk.rejected,
                    signTransactionThunk.rejected,
                    pushSendFormTransactionThunk.rejected,
                ),
                (state, { payload: error }) => {
                    state.error = error ?? null;
                },
            )
            // In case that this reducer does not match the action, try to handle it by suite-common sendFormReducer.
            .addDefaultCase((state, action) => {
                commonSendFormReducer(state, action);
            });
    },
});

const createMemoizedSelector = createWeakMapSelector.withTypes<NativeSendRootState>();

export const selectFeeLevels = (state: NativeSendRootState) => state.wallet.send.feeLevels;
export const selectCustomFeeLevel = (
    state: NativeSendRootState,
): GeneralPrecomposedTransaction | undefined => state.wallet.send.feeLevels.custom;

export const selectFeeLevelTransactionBytes = createMemoizedSelector(
    [
        selectFeeLevels,
        (_state: NativeSendRootState, feeLevelLabel: NativeSupportedFeeLevel) => feeLevelLabel,
    ],
    (feeLevels, feeLevelLabel) => {
        const feeLevel = feeLevels[feeLevelLabel];
        if (feeLevel && feeLevel.type !== 'error') {
            const { bytes, fee, feePerByte, feeLimit } = feeLevel;
            if (bytes !== 0) {
                return feeLevel.bytes;
            }

            // Ethereum-based fee level does not have bytes stored as attribute
            // so we need to calculate it from fee, feePerByte and feeLimit.
            if (fee && feePerByte && feeLimit) {
                return BigNumber(fee).div(feePerByte).div(feeLimit).toNumber();
            }
        }

        return 0;
    },
);

export const { storeFeeLevels } = sendFormSlice.actions;
