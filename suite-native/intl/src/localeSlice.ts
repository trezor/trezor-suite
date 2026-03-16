import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { DEFAULT_LOCALE, type LocaleCode } from './languages';
import { type SupportedLocaleCode, isOfficiallySupportedLanguage } from './types';
import { findClosestOfficiallySupportedLanguageLocale } from './utils';

export type AppLocaleOption = SupportedLocaleCode | 'system';

export type LocaleState = {
    appLocaleCode: AppLocaleOption;
    systemLocaleCode: LocaleCode;
};

export type LocaleSliceRootState = {
    locale: LocaleState;
};

export const localeInitialState: LocaleState = {
    appLocaleCode: 'system',
    systemLocaleCode: DEFAULT_LOCALE,
};

export const localePersistWhitelist: Array<keyof LocaleState> = [
    'appLocaleCode',
    'systemLocaleCode',
];

export const localeSlice = createSlice({
    name: 'locale',
    initialState: localeInitialState,
    reducers: {
        setAppLocaleCode: (state, { payload }: PayloadAction<AppLocaleOption>) => {
            state.appLocaleCode = payload;
        },
        setSystemLocaleCode: (state, { payload }: PayloadAction<LocaleCode>) => {
            state.systemLocaleCode = payload;
        },
    },
});

export const { setAppLocaleCode, setSystemLocaleCode } = localeSlice.actions;
export const localeReducer = localeSlice.reducer;

export const selectAppLocaleCode = (state: LocaleSliceRootState) => state.locale.appLocaleCode;

export const selectSystemLocaleCode = (state: LocaleSliceRootState) =>
    state.locale.systemLocaleCode;

export const selectLocale = (state: LocaleSliceRootState) => {
    const userSelectedLocaleCode = selectAppLocaleCode(state);
    const systemLocaleCode = selectSystemLocaleCode(state);

    return userSelectedLocaleCode === 'system' ? systemLocaleCode : userSelectedLocaleCode;
};

export const selectSupportedLanguageLocale = (state: LocaleSliceRootState): SupportedLocaleCode => {
    const locale = selectLocale(state);
    if (isOfficiallySupportedLanguage(locale)) {
        return locale;
    }

    return findClosestOfficiallySupportedLanguageLocale(locale);
};
