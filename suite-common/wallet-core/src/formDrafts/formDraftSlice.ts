import type { FieldValues } from 'react-hook-form';

import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

export interface FormDraftState {
    [key: string]: FieldValues;
}

export type FormDraftRootState = {
    wallet: {
        formDrafts: FormDraftState;
    };
};

export const formDraftInitialState: FormDraftState = {};

export const FORM_DRAFT = '@formDraft';

export const formDraftSlice = createSlice({
    name: FORM_DRAFT,
    initialState: formDraftInitialState,
    reducers: {
        storeDraft: (state, action: PayloadAction<{ key: string; formDraft: FieldValues }>) => {
            const { key, formDraft } = action.payload;
            state[key] = formDraft;
        },
        removeDraft: (state, action: PayloadAction<{ key: string }>) => {
            const { key } = action.payload;
            delete state[key];
        },
    },
});

export const formDraftReducer = formDraftSlice.reducer;
export const formDraftActions = formDraftSlice.actions;

export type FormDraftAction = ReturnType<(typeof formDraftActions)[keyof typeof formDraftActions]>;
