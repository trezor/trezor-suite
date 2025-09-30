import { LANGUAGES, Locale } from '@suite-common/suite-types';
import { getPlatformLanguages } from '@trezor/env-utils';

export const DEFAULT_LOCALE = 'en-US';

/**
 * Finds and returns first of languages preferred by user's environment
 * which is implemented and completed in Suite, or defaultLocale.
 */
export const getOsLocale = (): Locale => {
    const platformLanguages = getPlatformLanguages() || [];

    const isLocale = (lang: string): lang is Locale => lang in LANGUAGES;

    for (const platformLanguage of platformLanguages) {
        if (isLocale(platformLanguage)) {
            return platformLanguage;
        }
        // If your locale variant (e.g. en-GB) is not available, try to find a variant of your locale that is supported (e.g. en-US)
        const languageVariant = (Object.keys(LANGUAGES) as Locale[]).find(
            language => language.slice(0, 2) === platformLanguage.slice(0, 2),
        );
        if (languageVariant) {
            return languageVariant;
        }
    }

    return DEFAULT_LOCALE;
};

export const watchOsLocale = (callback: (loc: Locale) => void) => {
    const onLanguageChange = () => callback(getOsLocale());
    window.addEventListener('languagechange', onLanguageChange);

    return () => window.removeEventListener('languagechange', onLanguageChange);
};
