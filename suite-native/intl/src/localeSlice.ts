import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { NativeLocale } from '@suite-common/suite-types';

export type LocaleTag = NativeLocale | 'system';

export type LocaleState = {
    localeTag: LocaleTag;
};

export type LocaleSliceRootState = {
    locale: LocaleState;
};

export const localeInitialState: LocaleState = {
    localeTag: 'system',
};

export const localePersistWhitelist: Array<keyof LocaleState> = ['localeTag'];

export const localeSlice = createSlice({
    name: 'locale',
    initialState: localeInitialState,
    reducers: {
        setLocale: (state, { payload }: PayloadAction<LocaleTag>) => {
            state.localeTag = payload;
        },
    },
});

export const selectUserSelectedLocaleTag = (state: LocaleSliceRootState) => state.locale.localeTag;

export const { setLocale } = localeSlice.actions;
export const localeReducer = localeSlice.reducer;
