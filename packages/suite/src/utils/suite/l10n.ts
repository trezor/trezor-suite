import { LANGUAGES } from '@suite-config';

export const getInitialLocale = (navigatorLanguage: string, defaultLocale = 'en') => {
    if (!navigatorLanguage) return defaultLocale;

    const browserLocale = navigatorLanguage.split('-')[0];
    if (LANGUAGES.some(e => e.code === browserLocale)) {
        // Array of supported languages contains the locale we're looking for
        return browserLocale;
    }
    // if browser lang is not supported return en as default locale
    return defaultLocale;
};
