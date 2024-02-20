import LANGUAGES, { Locale, TRANSLATION_PSEUDOLANGUAGE } from 'src/config/suite/languages';
import { getPlatformLanguages } from '@trezor/env-utils';

const TRANSLATION_MODE_FLAG = 'translation_mode';
const DEFAULT_LOCALE = 'en';

export const isTranslationMode = () => localStorage.getItem(TRANSLATION_MODE_FLAG) === 'true';

export const setTranslationMode = (value: boolean) => {
    if (value !== isTranslationMode()) {
        if (value) localStorage.setItem(TRANSLATION_MODE_FLAG, 'true');
        else localStorage.removeItem(TRANSLATION_MODE_FLAG);
        window.location.reload();
    }
};

export const isLocale = (lang: string): lang is Locale => lang in LANGUAGES;

export const isCompletedLocale = (lang: string): lang is Locale =>
    isLocale(lang) && !!LANGUAGES[lang].type;

/**
 * Finds and returns first of languages preferred by user's environment
 * which is implemented and completed in Suite, or defaultLocale.
 */
export const getOsLocale = (defaultLocale: Locale = DEFAULT_LOCALE): Locale => {
    const languages = getPlatformLanguages() || [];

    return languages.map(lang => lang.split('-')[0]).find(isCompletedLocale) || defaultLocale;
};

export const watchOsLocale = (callback: (loc: Locale) => void) => {
    const onLanguageChange = () => callback(getOsLocale());
    window.addEventListener('languagechange', onLanguageChange);

    return () => window.removeEventListener('languagechange', onLanguageChange);
};

/**
 * Ensures that when translation mode is on, only translation pseudolanguage is used,
 * and vice versa, when translation mode is off, pseudolanguage is never used.
 */
export const ensureLocale = (loc: string): Locale => {
    const translationMode = isTranslationMode();
    if (translationMode) return TRANSLATION_PSEUDOLANGUAGE;
    if (loc === TRANSLATION_PSEUDOLANGUAGE) return DEFAULT_LOCALE;

    return isLocale(loc) ? loc : DEFAULT_LOCALE;
};
