import { LANGUAGES, type Locale } from '@suite-common/suite-types';
import { getPlatformLanguages } from '@trezor/env-utils';

const DEFAULT_LOCALE = 'en-US';

/**
 * Finds and returns first of languages preferred by user's environment
 * which is implemented and completed in Suite, or defaultLocale.
 */
export const getOsLocale = (defaultLocale: Locale = DEFAULT_LOCALE): Locale => {
    const platformLanguages = getPlatformLanguages() || [];

    const isLocale = (lang: string): lang is Locale => lang in LANGUAGES;

    const suiteLanguageCodes = Object.keys(LANGUAGES) as Locale[];
    for (const platformLanguage of platformLanguages) {
        if (isLocale(platformLanguage)) {
            return platformLanguage;
        }

        // Some languages may have different name in OS than in Suite (e.g. Taiwanese Mandarin is zh-Hant-TW)
        const languageUnderDifferentNameInOs = suiteLanguageCodes.find(language => {
            const languageInfo = LANGUAGES[language];

            return (
                'nameInOsStartsWith' in languageInfo &&
                platformLanguage.startsWith(languageInfo.nameInOsStartsWith)
            );
        });
        if (languageUnderDifferentNameInOs) {
            return languageUnderDifferentNameInOs;
        }

        // If your locale variant (e.g. en-GB) is not available, try to find a variant of your locale that is supported (e.g. en-US)
        const languageVariant = suiteLanguageCodes.find(
            language => language.slice(0, 2) === platformLanguage.slice(0, 2),
        );
        if (languageVariant) {
            return languageVariant;
        }
    }

    return defaultLocale;
};

export const watchOsLocale = (callback: (loc: Locale) => void) => {
    const onLanguageChange = () => callback(getOsLocale());
    window.addEventListener('languagechange', onLanguageChange);

    return () => window.removeEventListener('languagechange', onLanguageChange);
};
