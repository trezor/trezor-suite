import { isAnyOf } from '@reduxjs/toolkit';

import { createSliceWithExtraDeps } from '@suite-common/redux-utils';
import {
    SendState as CommonSendState,
    prepareSendFormReducer as prepareCommonSendFormReducer,
    initialState as commonInitialState,
    composeSendFormTransactionFeeLevelsThunk,
    signTransactionThunk,
    pushSendFormTransactionThunk,
    SendFormError,
} from '@suite-common/wallet-core';

type NativeSendState = CommonSendState & {
    error: null | SendFormError;
};

export type NativeSendRootState = {
    wallet: {
        send: NativeSendState;
    };
};

export const initialNativeState: NativeSendState = {
    ...commonInitialState,
    error: null,
};

export const sendFormSlice = createSliceWithExtraDeps({
    name: 'send',
    initialState: initialNativeState,
    reducers: {},
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
