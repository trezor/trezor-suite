import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { SupportedLanguage, isOfficiallySupportedLanguage, isSupportedLanguage } from './types';

export type LocaleTag = SupportedLanguage | 'system';

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

export const { setLocale } = localeSlice.actions;
export const localeReducer = localeSlice.reducer;

export const selectUserSelectedLocaleTag = (state: LocaleSliceRootState) => state.locale.localeTag;

export const selectIsLanguageLocaleSupported = (
    state: LocaleSliceRootState,
    systemLocaleTag: string,
) => {
    const userSelectedLocaleTag = selectUserSelectedLocaleTag(state);

    if (userSelectedLocaleTag === 'system') {
        return isOfficiallySupportedLanguage(systemLocaleTag);
    }

    return isSupportedLanguage(userSelectedLocaleTag);
};
