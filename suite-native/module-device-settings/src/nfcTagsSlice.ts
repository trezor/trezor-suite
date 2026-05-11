import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

type NfcTagsState = {
    labels: Record<string, string>;
};

const initialState: NfcTagsState = {
    labels: {},
};

export const nfcTagsSlice = createSlice({
    name: 'nfcTags',
    initialState,
    reducers: {
        setNfcTagLabel: (state, action: PayloadAction<{ tagId: string; label: string }>) => {
            state.labels[action.payload.tagId] = action.payload.label;
        },
    },
});

export const { setNfcTagLabel } = nfcTagsSlice.actions;
export const nfcTagsReducer = nfcTagsSlice.reducer;

export const nfcTagsPersistWhitelist: Array<keyof NfcTagsState> = ['labels'];

export const selectNfcTagLabel = (
    state: { nfcTags: NfcTagsState },
    tagId: string,
): string | undefined => state.nfcTags.labels[tagId];
