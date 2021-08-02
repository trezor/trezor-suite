import { LANGUAGES } from '@suite-config';

export const getInitialLocale = (navigatorLanguage: string, defaultLocale = 'en') => {
    if (!navigatorLanguage) return defaultLocale;

    const browserLocale = navigatorLanguage.split('-')[0];
    if (browserLocale in LANGUAGES) {
        // Array of supported languages contains the locale we're looking for
        return browserLocale;
    }
    // if browser lang is not supported return en as default locale
    return defaultLocale;
};
