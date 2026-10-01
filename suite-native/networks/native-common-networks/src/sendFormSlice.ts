import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import type { NetworkSymbol } from '@suite-common/networks';

/**
 * Draft of the generic send form for one network. Values of declared fields are keyed by field
 * id, so the slice needs no knowledge of which fields a network has.
 */
export type SendFormDraft = {
    address: string;
    fields: Record<string, string>;
    /** Undefined until the user picks a level; the form then shows the strategy's first level. */
    selectedFeeLevelId?: string;
};

/** One draft per network symbol: drafts of different networks never interfere. */
export type SendFormState = Record<NetworkSymbol, SendFormDraft>;

export type SendFormRootState = {
    nativeNetworks: {
        sendForm: SendFormState;
    };
};

export const sendFormInitialState: SendFormState = {};

const emptyDraft: SendFormDraft = { address: '', fields: {} };

const getDraft = (state: SendFormState, networkSymbol: NetworkSymbol): SendFormDraft => {
    state[networkSymbol] ??= { ...emptyDraft, fields: {} };

    return state[networkSymbol];
};

const sendFormSlice = createSlice({
    name: 'sendForm',
    initialState: sendFormInitialState,
    reducers: {
        setAddress(
            state: SendFormState,
            action: PayloadAction<{ networkSymbol: NetworkSymbol; address: string }>,
        ) {
            getDraft(state, action.payload.networkSymbol).address = action.payload.address;
        },
        setField(
            state: SendFormState,
            action: PayloadAction<{ networkSymbol: NetworkSymbol; fieldId: string; value: string }>,
        ) {
            getDraft(state, action.payload.networkSymbol).fields[action.payload.fieldId] =
                action.payload.value;
        },
        selectFeeLevel(
            state: SendFormState,
            action: PayloadAction<{ networkSymbol: NetworkSymbol; feeLevelId: string }>,
        ) {
            getDraft(state, action.payload.networkSymbol).selectedFeeLevelId =
                action.payload.feeLevelId;
        },
    },
});

export const selectSendFormDraft = (
    state: SendFormRootState,
    networkSymbol: NetworkSymbol,
): SendFormDraft => state.nativeNetworks.sendForm[networkSymbol] ?? emptyDraft;

export const { setAddress, setField, selectFeeLevel } = sendFormSlice.actions;
export const sendFormReducer = sendFormSlice.reducer;
