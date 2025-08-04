import { LANGUAGES, Locale } from '@suite-common/suite-types';
import { getPlatformLanguages } from '@trezor/env-utils';

const DEFAULT_LOCALE = 'en-US';

export const isLocale = (lang: string): lang is Locale => lang in LANGUAGES;

export const isCompletedLocale = (lang: string): lang is Locale =>
    isLocale(lang) && !!LANGUAGES[lang].type;

/**
 * Finds and returns first of languages preferred by user's environment
 * which is implemented and completed in Suite, or defaultLocale.
 */
export const getOsLocale = (defaultLocale: Locale = DEFAULT_LOCALE): Locale => {
    const languages = getPlatformLanguages() || [];

    return languages.find(isCompletedLocale) || defaultLocale;
};

export const watchOsLocale = (callback: (loc: Locale) => void) => {
    const onLanguageChange = () => callback(getOsLocale());
    window.addEventListener('languagechange', onLanguageChange);

    return () => window.removeEventListener('languagechange', onLanguageChange);
};

/**
 * Ensure locale is valid and return it, otherwise return defaultLocale.
 */
export const ensureLocale = (loc: string): Locale => (isLocale(loc) ? loc : DEFAULT_LOCALE);
