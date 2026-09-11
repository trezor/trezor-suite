import type { FieldValues } from 'react-hook-form';

import { createSlice } from '@reduxjs/toolkit';

import {
    FORM_DRAFT as COMMON_FORM_DRAFT,
    type FormDraftAction,
    formDraftReducer as commonFormDraftReducer,
    formDraftInitialState,
} from '@suite-common/wallet-core';

import { storageLoad } from 'src/actions/suite/storageLifecycleActions';

export const FORM_DRAFT = 'formDraft';

export const formDraftSlice = createSlice({
    name: FORM_DRAFT,
    initialState: formDraftInitialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(storageLoad, (state, { payload }) => {
                // Preserve handling of error payloads sent with STORAGE.LOAD.
                if (
                    typeof payload === 'string' &&
                    (payload === 'blocked' || payload === 'blocking')
                ) {
                    return;
                }

                payload.formDrafts.forEach(
                    ({ key, value }: { key: string; value: FieldValues }) => {
                        state[key] = value;
                    },
                );
            })
            .addMatcher(
                action => action.type.startsWith(COMMON_FORM_DRAFT),
                (state, action: FormDraftAction) => {
                    commonFormDraftReducer(state, action);
                },
            );
    },
});

const formDraftReducer = formDraftSlice.reducer;

export default formDraftReducer;
