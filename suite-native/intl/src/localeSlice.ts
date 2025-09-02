import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { NativeLocale } from '@suite-common/suite-types';

type LanguageOption = NativeLocale | 'system';

export type LocaleState = {
    language: LanguageOption;
};

export type LocaleSliceRootState = {
    locale: LocaleState;
};

export const localeInitialState: LocaleState = {
    language: 'system',
};

export const localePersistWhitelist: Array<keyof LocaleState> = ['language'];

export const localeSlice = createSlice({
    name: 'locale',
    initialState: localeInitialState,
    reducers: {
        setLanguage: (state, { payload }: PayloadAction<LanguageOption>) => {
            state.language = payload;
        },
    },
});

export const selectLanguage = (state: LocaleSliceRootState) => state.locale.language;

export const { setLanguage } = localeSlice.actions;
export const localeReducer = localeSlice.reducer;
