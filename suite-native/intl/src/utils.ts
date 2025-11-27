import { DEFAULT_LOCALE, LANGUAGES } from './languages';
import { SupportedLocaleCode } from './types';

// flatten object to single level deep like { a: { b: { c: 1 } } } => { 'a.b.c': 1 }
export const flatten = (obj: Record<string, any>, prefix = '') => {
    const result: Record<string, any> = {};
    Object.keys(obj).forEach(key => {
        const value = obj[key];
        const prefixedKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object') {
            Object.assign(result, flatten(value, prefixedKey));
        } else {
            result[prefixedKey] = value;
        }
    });

    return result;
};

export const unflatten = (obj: Record<string, any>) => {
    const result: Record<string, any> = {};

    for (const [flatKey, value] of Object.entries(obj)) {
        const keys = flatKey.split('.');
        let current = result;

        keys.forEach((key, index) => {
            if (index === keys.length - 1) {
                current[key] = value;
            } else {
                if (!(key in current)) {
                    current[key] = {};
                }
                current = current[key];
            }
        });
    }

    return result;
};

export const findClosestOfficiallySupportedLanguageLocale = (
    locale: string,
): SupportedLocaleCode => {
    const [language, _region] = locale.split('-');

    const matchingOfficialLanguageLocale = Object.entries(LANGUAGES).find(
        ([key, { type }]) => type === 'official' && key.startsWith(language),
    )?.[0] as SupportedLocaleCode | undefined;

    return matchingOfficialLanguageLocale ?? DEFAULT_LOCALE;
};
