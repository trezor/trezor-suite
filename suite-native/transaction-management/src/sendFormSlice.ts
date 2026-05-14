import { type PayloadAction, isAnyOf } from '@reduxjs/toolkit';

import { createSliceWithExtraDeps } from '@suite-common/redux-utils';
import {
    type SendState as CommonSendState,
    type SendFormError,
    initialState as commonInitialState,
    composeSendFormTransactionFeeLevelsThunk,
    prepareSendFormReducer as prepareCommonSendFormReducer,
    pushSendFormTransactionThunk,
    signTransactionThunk,
} from '@suite-common/wallet-core';
import { type GeneralPrecomposedLevels } from '@suite-common/wallet-types';

type NativeSendState = CommonSendState & {
    error: null | SendFormError;
    feeLevels: GeneralPrecomposedLevels;
};

export type NativeSendRootState = {
    wallet: {
        send: NativeSendState;
    };
};

export const sendFormInitialState: NativeSendState = {
    ...commonInitialState,
    error: null,
    feeLevels: {},
};

export const sendFormSlice = createSliceWithExtraDeps({
    name: 'send',
    initialState: sendFormInitialState,
    reducers: {
        clearFeeLevels: state => {
            state.feeLevels = {};
        },
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

export const transactionManagementActions = sendFormSlice.actions;
