import { LANGUAGE } from 'config/variables';

export const getInitialLocale = (defaultLocale = 'en') => {
    const browserLocale = navigator.language.split('-')[0];
    if (LANGUAGE.some(e => e.code === browserLocale)) {
        // Array of supported languages contains the locale we're looking for
        return browserLocale;
    }
    // if browser lang is not supported return en as default locale
    return defaultLocale;
};