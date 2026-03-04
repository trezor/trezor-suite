import { DEFAULT_LOCALE, LocaleCode } from '../languages';
import {
    LocaleSliceRootState,
    LocaleState,
    selectLocale,
    selectSupportedLanguageLocale,
} from '../localeSlice';
import { SupportedLocaleCode } from '../types';

describe('selectSupportedLanguageLocale', () => {
    const testCases = [
        {
            description: 'should return supported system locale when app locale is "system"',
            localeState: {
                appLocaleCode: 'system',
                systemLocaleCode: 'cs-CZ',
            },
            expectedResultLocale: 'cs-CZ',
        },
        {
            description:
                'should return default locale when app locale is "system" and system locale is not supported',
            localeState: {
                appLocaleCode: 'system',
                systemLocaleCode: 'es-ES',
            },
            expectedResultLocale: DEFAULT_LOCALE,
        },
        {
            description: 'should return app locale even if the system locale is supported',
            localeState: {
                appLocaleCode: 'cs-CZ',
                systemLocaleCode: 'en-US',
            },
            expectedResultLocale: 'cs-CZ',
        },
        {
            description:
                'should return supported language locale even if the system locale is matching only on language, but has different region',
            localeState: {
                appLocaleCode: 'system',
                systemLocaleCode: 'de-AT',
            },
            expectedResultLocale: 'de-DE',
        },
    ] as const satisfies {
        description: string;
        localeState: LocaleState;
        expectedResultLocale: SupportedLocaleCode;
    }[];

    it.each(testCases)('$description', ({ localeState, expectedResultLocale }) => {
        const state: LocaleSliceRootState = {
            locale: localeState,
        };

        expect(selectSupportedLanguageLocale(state)).toBe(expectedResultLocale);
    });
});

describe('selectLocale', () => {
    const testCases = [
        {
            description: 'should return system locale when app locale is "system"',
            localeState: {
                appLocaleCode: 'system',
                systemLocaleCode: 'cs-CZ',
            },
            expectedResultLocale: 'cs-CZ',
        },
        {
            description: 'should return app locale when it has any other value than "system"',
            localeState: {
                appLocaleCode: 'ja-JP',
                systemLocaleCode: 'cs-CZ',
            },
            expectedResultLocale: 'ja-JP',
        },
    ] as const satisfies {
        description: string;
        localeState: LocaleState;
        expectedResultLocale: LocaleCode;
    }[];

    it.each(testCases)('$description', ({ localeState, expectedResultLocale }) => {
        const state: LocaleSliceRootState = {
            locale: localeState,
        };

        expect(selectLocale(state)).toBe(expectedResultLocale);
    });
});
