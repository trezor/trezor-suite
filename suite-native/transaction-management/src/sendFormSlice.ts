import { type PayloadAction, isAnyOf } from '@reduxjs/toolkit';

import { createSliceWithExtraDeps } from '@suite-common/redux-utils';
import {
    type SendState as CommonSendState,
    type SendFormError,
    type SendFormReducerDeps,
    initialState as commonInitialState,
    composeSendFormTransactionFeeLevelsThunk,
    prepareSendFormReducer as prepareCommonSendFormReducer,
    pushSendFormTransactionThunk,
    signTransactionThunk,
} from '@suite-common/wallet-core';
import {
    type AccountKey,
    type GeneralPrecomposedLevels,
    type SendFormDraftKey,
    type TokenAddress,
} from '@suite-common/wallet-types';
import { getSendFormDraftKey } from '@suite-common/wallet-utils';

import { type FeeLevelsMaxAmount } from './types/fees';

type FeeLevelsMaxAmountBySendKey = Partial<Record<SendFormDraftKey, FeeLevelsMaxAmount>>;

type StoreFeeLevelsMaxAmountPayload = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
    feeLevelsMaxAmount: FeeLevelsMaxAmount;
};

type ClearFeeLevelsMaxAmountPayload = Omit<StoreFeeLevelsMaxAmountPayload, 'feeLevelsMaxAmount'>;

type NativeSendState = CommonSendState & {
    error: null | SendFormError;
    feeLevels: GeneralPrecomposedLevels;
    feeLevelsMaxAmount: FeeLevelsMaxAmountBySendKey;
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
    feeLevelsMaxAmount: {},
};

const sendFormSlice = createSliceWithExtraDeps({
    name: 'send',
    initialState: sendFormInitialState,
    reducers: {
        clearFeeLevels: (state: NativeSendState) => {
            state.feeLevels = {};
        },
        storeFeeLevels: (
            state: NativeSendState,
            { payload }: PayloadAction<{ feeLevels: GeneralPrecomposedLevels }>,
        ) => {
            state.feeLevels = payload.feeLevels;
        },
        storeFeeLevelsMaxAmount: (
            state: NativeSendState,
            { payload }: PayloadAction<StoreFeeLevelsMaxAmountPayload>,
        ) => {
            const { accountKey, tokenContract, feeLevelsMaxAmount } = payload;

            state.feeLevelsMaxAmount[getSendFormDraftKey(accountKey, tokenContract)] =
                feeLevelsMaxAmount;
        },
        clearFeeLevelsMaxAmount: (
            state: NativeSendState,
            { payload }: PayloadAction<ClearFeeLevelsMaxAmountPayload>,
        ) => {
            delete state.feeLevelsMaxAmount[
                getSendFormDraftKey(payload.accountKey, payload.tokenContract)
            ];
        },
    },
    extraReducers: (builder, extra: SendFormReducerDeps) => {
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
export const prepareSendFormReducer = sendFormSlice.prepareReducer;
