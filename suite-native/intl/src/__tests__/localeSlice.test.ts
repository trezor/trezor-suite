import {
    AppLocaleOption,
    LocaleSliceRootState,
    selectIsLanguageLocaleSupported,
} from '../localeSlice';

describe('selectIsLanguageLocaleSupported', () => {
    const testCases = [
        {
            description:
                'should return true when user selected locale is "system" and system locale is officially supported',
            appLocaleCode: 'system',
            systemLocaleCode: 'en-US',
            expectedResult: true,
        },
        {
            description:
                'should return false when user selected locale is "system" and system locale is community supported',
            appLocaleCode: 'system',
            systemLocaleCode: 'cs-CZ',
            expectedResult: false,
        },
        {
            description:
                'should return false when user selected locale is "system" and system locale is not supported',
            appLocaleCode: 'system',
            systemLocaleCode: 'fr-FR',
            expectedResult: false,
        },
        {
            description:
                'should return true when user selected locale is a supported language (official)',
            appLocaleCode: 'en-US',
            systemLocaleCode: 'en-US',
            expectedResult: true,
        },
        {
            description:
                'should return true when user selected locale is a supported language (community)',
            appLocaleCode: 'cs-CZ',
            systemLocaleCode: 'en-US',
            expectedResult: true,
        },
    ] as const satisfies {
        description: string;
        appLocaleCode: AppLocaleOption;
        systemLocaleCode: string;
        expectedResult: boolean;
    }[];

    it.each(testCases)('$description', ({ appLocaleCode, systemLocaleCode, expectedResult }) => {
        const state: LocaleSliceRootState = {
            locale: {
                appLocaleCode,
                systemLocaleCode,
            },
        };

        expect(selectIsLanguageLocaleSupported(state, systemLocaleCode)).toBe(expectedResult);
    });
});
