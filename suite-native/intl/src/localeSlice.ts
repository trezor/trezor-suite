import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { DEFAULT_LOCALE, type LocaleCode } from './languages';
import { type SupportedLocaleCode, isOfficiallySupportedLanguage } from './types';
import { findClosestOfficiallySupportedLanguageLocale } from './utils';

export type AppLocaleOption = SupportedLocaleCode | 'system';

export type LocaleState = {
    appLocaleCode: AppLocaleOption;
    systemLocaleCode: LocaleCode;
    areDebugTranslationKeysDisplayed: boolean;
};

export type LocaleSliceRootState = {
    locale: LocaleState;
};

export const localeInitialState: LocaleState = {
    appLocaleCode: 'system',
    systemLocaleCode: DEFAULT_LOCALE,
    areDebugTranslationKeysDisplayed: false,
};

export const localePersistWhitelist: Array<keyof LocaleState> = [
    'appLocaleCode',
    'systemLocaleCode',
    'areDebugTranslationKeysDisplayed',
];

const localeSlice = createSlice({
    name: 'locale',
    initialState: localeInitialState,
    reducers: {
        setAppLocaleCode: (state: LocaleState, { payload }: PayloadAction<AppLocaleOption>) => {
            state.appLocaleCode = payload;
        },
        setSystemLocaleCode: (state: LocaleState, { payload }: PayloadAction<LocaleCode>) => {
            state.systemLocaleCode = payload;
        },
        setAreDebugTranslationKeysDisplayed: (
            state: LocaleState,
            { payload }: PayloadAction<boolean>,
        ) => {
            state.areDebugTranslationKeysDisplayed = payload;
        },
    },
});

export const { setAppLocaleCode, setSystemLocaleCode, setAreDebugTranslationKeysDisplayed } =
    localeSlice.actions;
export const localeReducer = localeSlice.reducer;

export const selectAppLocaleCode = (state: LocaleSliceRootState) => state.locale.appLocaleCode;

export const selectAreDebugTranslationKeysDisplayed = (state: LocaleSliceRootState) =>
    state.locale.areDebugTranslationKeysDisplayed;

const selectSystemLocaleCode = (state: LocaleSliceRootState) => state.locale.systemLocaleCode;

/**
 * Select either the locale selected in-app, or if set to system, the preferred system one.
 * Note that this does not guarantee app language! See selectSupportedLanguageLocale
 */
export const selectLocale = (state: LocaleSliceRootState) => {
    const userSelectedLocaleCode = selectAppLocaleCode(state);
    const systemLocaleCode = selectSystemLocaleCode(state);

    return userSelectedLocaleCode === 'system' ? systemLocaleCode : userSelectedLocaleCode;
};

/**
 * Selects the actual resolved language – either explicitely selected in-app, or if set to system,
 * resolved from preferred locale (either it is a supported language, or fallback is used).
 */
export const selectSupportedLanguageLocale = (state: LocaleSliceRootState): SupportedLocaleCode => {
    const locale = selectLocale(state);
    if (isOfficiallySupportedLanguage(locale)) {
        return locale;
    }

    return findClosestOfficiallySupportedLanguageLocale(locale);
};
